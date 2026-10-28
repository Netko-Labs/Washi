import { describe, expect, test } from 'bun:test'
import type { ScriptBridge } from '../../../lib/types'
import { paperRegistry } from '../../../registry/specs'
import { openSandbox } from '../lib/sandbox'
import { checkTree, toNodes } from '../lib/utils'

const NAMES = Object.keys(paperRegistry.components)

function bridge(
  page: Record<string, string> = {},
): ScriptBridge & { sets: string[][]; wanted: string[] } {
  const sets: string[][] = []
  const wanted: string[] = []
  return {
    sets,
    wanted,
    state: (key) => page[key],
    set: (key, json) => void sets.push([key, json]),
    rows: (query) => {
      wanted.push(query)
      return undefined
    },
    interval: () => {},
    act: () => {},
  }
}

const COUNTER = `function view() {
  const [n, setN] = useState('n', 0)
  return h(Card, { title: 'Counter' }, h(Text, null, 'Count ', n), h(Button, { onPress: () => setN(n + 1) }, 'Add'))
}`

describe('a script in its sandbox', () => {
  test('draws registry primitives; a press becomes an action that stays in the browser', async () => {
    const sandbox = await openSandbox(COUNTER, NAMES)
    const run = sandbox.call('__render()', bridge({ n: '2' }))
    expect(run.ok).toBe(true)
    const checked = checkTree(toNodes(JSON.parse(run.ok ? run.value : 'null')))
    expect('root' in checked).toBe(true)
    const card = 'root' in checked ? checked.root.children[0] : undefined
    const button = card?.kind === 'element' ? card.children[1] : undefined
    expect(button).toMatchObject({
      name: 'Button',
      props: { action: { verb: 'script.invoke', handler: 0 } },
    })
    const seen = bridge({ n: '2' })
    sandbox.call('__invoke(0)', seen)
    expect(seen.sets).toEqual([['n', '3']])
    sandbox.dispose()
  })

  test('a loop that never ends is stopped at the deadline, and memory has a ceiling', async () => {
    const spin = await openSandbox('function view() { while (true) {} }', NAMES)
    expect(spin.call('__render()', bridge())).toEqual({ ok: false, error: 'ran past 60 ms' })
    spin.dispose()
    const hog = await openSandbox(
      'function view() { const a = []; while (true) a.push("x".repeat(100000)) }',
      NAMES,
    )
    expect(hog.call('__render()', bridge()).ok).toBe(false)
    hog.dispose()
  })

  test('there is no network, page or timer to reach', async () => {
    const sandbox = await openSandbox(
      'function view() { return [typeof fetch, typeof document, typeof window, typeof setTimeout].join(",") }',
      NAMES,
    )
    const run = sandbox.call('__render()', bridge())
    expect(run.ok && JSON.parse(run.value)).toBe('undefined,undefined,undefined,undefined')
    sandbox.dispose()
  })

  test('rows are asked for by query; the first run draws without them', async () => {
    const sandbox = await openSandbox(
      "function view() { const rows = useRows({ table: 'tasks' }); return h(Stat, { label: 'Open', value: rows.length }) }",
      NAMES,
    )
    const asked = bridge()
    const run = sandbox.call('__render()', asked)
    expect(asked.wanted).toEqual(['{"table":"tasks"}'])
    expect(run.ok && JSON.parse(run.value)).toMatchObject({ name: 'Stat', props: { value: 0 } })
    sandbox.dispose()
  })

  test('what it draws is checked like a page: no unknown primitive, no script in a script', () => {
    expect(checkTree(toNodes({ name: 'Marquee', props: {}, children: [] }))).toMatchObject({
      reason: expect.stringContaining('Marquee'),
    })
    expect(checkTree(toNodes({ name: 'Script', props: {}, children: ['x'] }))).toEqual({
      reason: 'a script cannot draw another script',
    })
  })
})
