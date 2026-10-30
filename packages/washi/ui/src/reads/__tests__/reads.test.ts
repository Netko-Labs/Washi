import { describe, expect, test } from 'bun:test'
import { createReads, stableKey } from '../utils'

function counted<T>(answer: () => Promise<T>) {
  const ask = () => {
    ask.calls += 1
    return answer()
  }
  ask.calls = 0
  return ask
}

describe('a read asked twice is asked once', () => {
  test('callers in flight share one request', async () => {
    const reads = createReads(10_000)
    const ask = counted(async () => ['ana', 'kai'])
    const [first, second] = await Promise.all([
      reads.share('members', ask),
      reads.share('members', ask),
    ])
    expect(ask.calls).toBe(1)
    expect(second).toBe(first)
  })

  test('a settled read answers again while fresh, then asks', async () => {
    let clock = 0
    const reads = createReads(1_000, () => clock)
    const ask = counted(async () => clock)
    await reads.share('tables', ask)
    clock = 999
    await reads.share('tables', ask)
    expect(ask.calls).toBe(1)
    clock = 1_000
    expect(await reads.share('tables', ask)).toBe(1_000)
    expect(ask.calls).toBe(2)
  })

  test('different keys ask separately', async () => {
    const reads = createReads(10_000)
    const ask = counted(async () => 1)
    await Promise.all([reads.share('a', ask), reads.share('b', ask)])
    expect(ask.calls).toBe(2)
  })
})

describe('never stale after a change', () => {
  test('forget makes the next caller ask the server', async () => {
    const reads = createReads(10_000)
    let rows = 1
    const ask = counted(async () => rows)
    expect(await reads.share('query', ask)).toBe(1)
    rows = 2
    reads.forget()
    expect(await reads.share('query', ask)).toBe(2)
    expect(ask.calls).toBe(2)
  })

  test('a read in flight when forgotten is not shared afterwards', async () => {
    const reads = createReads(10_000)
    let release: (value: number) => void = () => {}
    const before = reads.share('query', () => new Promise<number>((done) => (release = done)))
    reads.forget()
    const ask = counted(async () => 2)
    const after = reads.share('query', ask)
    release(1)
    expect(await before).toBe(1)
    expect(await after).toBe(2)
    expect(ask.calls).toBe(1)
    expect(await reads.share('query', ask)).toBe(2)
    expect(ask.calls).toBe(1)
  })

  test('a failed read is not kept', async () => {
    const reads = createReads(10_000)
    let fails = true
    const ask = counted(async () => {
      if (fails) throw new Error('offline')
      return 'ok'
    })
    await expect(reads.share('tables', ask)).rejects.toThrow('offline')
    fails = false
    expect(await reads.share('tables', ask)).toBe('ok')
    expect(ask.calls).toBe(2)
  })
})

describe('equal queries share a key', () => {
  test('key order does not matter, values and array order do', () => {
    expect(stableKey({ table: 'tasks', limit: 10, where: [{ a: 1, b: 2 }] })).toBe(
      stableKey({ where: [{ b: 2, a: 1 }], limit: 10, table: 'tasks' }),
    )
    expect(stableKey({ table: 'tasks', limit: 10 })).not.toBe(stableKey({ table: 'tasks' }))
    expect(stableKey({ order: ['a', 'b'] })).not.toBe(stableKey({ order: ['b', 'a'] }))
  })
})
