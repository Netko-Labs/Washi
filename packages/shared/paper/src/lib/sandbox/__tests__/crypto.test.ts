import { describe, expect, test } from 'bun:test'
import { openSandbox } from '../sandbox'

const open = () =>
  openSandbox('', { prelude: '', names: [], deadlineMs: 100, memoryBytes: 8 * 1024 * 1024 })

describe('a package finds Web crypto in the sandbox', () => {
  test('getRandomValues fills a typed array, and randomUUID is a v4 UUID', async () => {
    const sandbox = await open()
    const filled = sandbox.call(
      'const a = crypto.getRandomValues(new Uint8Array(32)); String(a.some((x) => x !== 0) && a.length)',
      null,
    )
    expect(filled).toEqual({ ok: true, value: '32' })
    const uuid = sandbox.call('crypto.randomUUID()', null)
    expect(
      uuid.ok &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(uuid.value),
    ).toBe(true)
    expect(sandbox.call('String(crypto.randomUUID() === crypto.randomUUID())', null)).toEqual({
      ok: true,
      value: 'false',
    })
    sandbox.dispose()
  })
})
