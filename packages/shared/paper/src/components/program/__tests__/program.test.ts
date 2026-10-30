import { describe, expect, test } from 'bun:test'
import { parse } from '@washi/wsx'
import { openSandbox } from '../../../lib/sandbox'
import type { ProgramLive, ProgramNeeds, Sandbox } from '../../../lib/types'
import type { PaperHost } from '../../../provider'
import { PAGE_HOOKS } from '../../../registry/page-modules'
import { paperRegistry } from '../../../registry/specs'
import { programBridge } from '../lib/bridge'
import { checkDrawn, literalOnly, withNotice } from '../lib/utils'
import { PROGRAM_BRIDGE, programPrelude } from '../lib/values'

const NAMES = Object.keys(paperRegistry.components)
const PAGE = parse('<Sheet title="Tasks" icon="🦊"><Title>Tasks</Title></Sheet>')

/** A bundle as compilePage leaves it: `view` on `globalThis.__page`, the hooks off `__washi`. */
const bundle = (body: string) =>
  `(() => { const { useRows, useState, usePageState, useNavigate, useMe, useFile, act } = globalThis.__washi
function Kpi({ label, value }) { return h(Stat, { label, value }) }
globalThis.__page = { view: () => { ${body} } } })()`

const open = (body: string) =>
  openSandbox(bundle(body), {
    prelude: programPrelude(NAMES),
    names: PROGRAM_BRIDGE,
    deadlineMs: 100,
    memoryBytes: 32 * 1024 * 1024,
  })

function harness(values: Record<string, string | number | boolean | null> = {}) {
  const calls: string[] = []
  const host = {
    pageId: 'p1',
    openSheet: (id: string) => void calls.push(`open ${id}`),
    runAction: async (action: unknown) => void calls.push(`act ${JSON.stringify(action)}`),
  } as unknown as PaperHost
  const live: ProgramLive = {
    sandbox: null,
    title: 'Tasks',
    rows: new Map(),
    tables: new Map(),
    files: new Map(),
    members: undefined,
    me: undefined,
    halted: null,
    values,
    set: (key, value) => void calls.push(`set ${key}=${JSON.stringify(value)}`),
  }
  const needs: ProgramNeeds = {
    queries: [],
    tables: [],
    members: false,
    me: false,
    files: [],
    refused: null,
    every: 0,
    seeds: {},
  }
  const run = (sandbox: Sandbox, code = '__render()') => {
    const isPress = code.startsWith('__invoke')
    const result = sandbox.call(code, programBridge(live, host, needs, isPress))
    return result.ok ? JSON.parse(result.value) : result.error
  }
  return { calls, host, live, needs, run }
}

describe('a page that runs, in its sandbox (D100)', () => {
  test('every hook `washi` exports is there', async () => {
    const sandbox = await open(
      'return h(Sheet, { title: "t" }, Object.keys(globalThis.__washi).join())',
    )
    const drawn = harness().run(sandbox)
    expect(drawn.children[0].split(',').sort()).toEqual([...PAGE_HOOKS].sort())
    sandbox.dispose()
  })

  test('its own components unfold into primitives; rows are asked for, then drawn', async () => {
    const sandbox = await open(
      `const rows = useRows({ table: 'tasks' })
       return h(Sheet, { title: 'x' }, h(Kpi, { label: 'Open', value: rows.length }))`,
    )
    const page = harness()
    const first = checkDrawn(page.run(sandbox), PAGE)
    expect(page.needs.queries).toEqual(['{"table":"tasks"}'])
    expect(first).toMatchObject({
      root: {
        props: { title: 'Tasks', icon: '🦊' },
        children: [{ name: 'Stat', props: { value: 0 } }],
      },
    })
    page.live.rows.set('{"table":"tasks"}', '[{"id":"a"},{"id":"b"}]')
    expect(checkDrawn(page.run(sandbox), PAGE)).toMatchObject({
      root: { children: [{ name: 'Stat', props: { value: 2 } }] },
    })
    sandbox.dispose()
  })

  test('useFile is asked for, then read once: text, bytes, and a refusal in words (D119)', async () => {
    const sandbox = await open(
      `const text = useFile('file:a'); const bytes = useFile('file:b', { as: 'bytes' })
       return h(Sheet, { title: 'x' }, h(Text, null, String(text), ' ', bytes ? bytes.join('.') : 'none'))`,
    )
    const page = harness()
    expect(checkDrawn(page.run(sandbox), PAGE)).toMatchObject({
      root: { children: [{ children: [{ value: 'null none' }] }] },
    })
    expect(page.needs.files).toEqual(['text:file:a', 'bytes:file:b'])
    page.live.files.set('text:file:a', JSON.stringify({ value: 'héllo' }))
    page.live.files.set('bytes:file:b', JSON.stringify({ value: btoa('\x01\x02\xff') }))
    expect(checkDrawn(page.run(sandbox), PAGE)).toMatchObject({
      root: { children: [{ children: [{ value: 'héllo 1.2.255' }] }] },
    })
    const refused = await open(`useFile('file:c'); return h(Sheet, { title: 'x' })`)
    page.live.files.set('text:file:c', JSON.stringify({ error: 'file:c is 40 MB' }))
    expect(page.run(refused)).toContain('file:c is 40 MB')
    sandbox.dispose()
    refused.dispose()
  })

  test('a press runs its handler: local state, page state, a verb, a page opened', async () => {
    const sandbox = await open(
      `const [n, setN] = useState(0)
       const [, setTab] = usePageState('tab', 'week')
       const go = useNavigate()
       return h(Sheet, { title: 'x' }, h(Text, null, 'n ', n),
         h(Button, { onPress: () => { setN(n + 1); setTab('month'); act({ verb: 'table.insert', table: 't', data: {} }); go('p2') } }, 'Add'))`,
    )
    const page = harness()
    const before = checkDrawn(page.run(sandbox), PAGE)
    expect(before).toMatchObject({
      root: {
        children: [
          { children: [{ value: 'n 0' }] },
          { props: { action: { verb: 'script.invoke' } } },
        ],
      },
    })
    page.run(sandbox, '__invoke(0)')
    expect(page.calls).toEqual([
      'set tab="month"',
      'act {"verb":"table.insert","table":"t","data":{}}',
      'open p2',
    ])
    const after = checkDrawn(page.run(sandbox), PAGE)
    expect('root' in after && after.root.children[0]).toMatchObject({
      children: [{ value: 'n 1' }],
    })
    sandbox.dispose()
  })

  test('usePageState’s initial seeds an unset key once drawn — what a Select bound to it shows', async () => {
    const sandbox = await open(
      `const [tab] = usePageState('tab', 'week'); const [kind] = usePageState('kind', 'all')
       return h(Sheet, { title: 'x' }, h(Text, null, tab, ' ', kind))`,
    )
    const page = harness({ kind: 'mine' })
    expect(checkDrawn(page.run(sandbox), PAGE)).toMatchObject({
      root: { children: [{ children: [{ value: 'week mine' }] }] },
    })
    expect(page.needs.seeds).toEqual({ tab: 'week' })
    expect(page.calls).toEqual([])
    sandbox.dispose()
  })

  test('drawing never writes: a verb, a state change or a navigation mid-draw stops the page', async () => {
    const sandbox = await open(`act({ verb: 'table.delete', table: 't', row: 'a' }); return null`)
    const page = harness()
    expect(page.run(sandbox)).toContain('runs from a press')
    expect(page.calls).toEqual([])
    sandbox.dispose()
  })

  test('the bridge is out of the page’s reach, and the host refuses a write outside a press', async () => {
    const sandbox = await open(
      `return h(Sheet, { title: 'x' }, h(Text, null, [typeof __bridge_act, typeof __bridge_set, typeof __drawing].join()))`,
    )
    const page = harness()
    expect(checkDrawn(page.run(sandbox), PAGE)).toMatchObject({
      root: { children: [{ children: [{ value: 'undefined,undefined,undefined' }] }] },
    })
    sandbox.dispose()

    const bridge = programBridge(page.live, page.host, page.needs, false)
    bridge.act?.('{"verb":"table.delete","table":"t","row":"a"}')
    bridge.set?.('tab', '"month"')
    expect(page.needs.refused).toBe('act')
    expect(page.calls).toEqual([])
  })

  test('what it draws is checked like a page, and keeps the page’s own look', () => {
    expect(checkDrawn({ name: 'Card', props: {}, children: [] }, PAGE)).toEqual({
      reason: 'view() must draw one <Sheet>',
    })
    expect(
      checkDrawn(
        { name: 'Sheet', props: { title: 'hacked', visibility: 'public' }, children: [] },
        PAGE,
      ),
    ).toMatchObject({ root: { props: { title: 'Tasks', icon: '🦊' } } })
    const marquee = {
      name: 'Sheet',
      props: {},
      children: [{ name: 'Marquee', props: {}, children: [] }],
    }
    expect(checkDrawn(marquee, PAGE)).toMatchObject({ reason: expect.stringContaining('Marquee') })
  })

  test('a refusal names each primitive once, and is said inside the page as a callout', () => {
    const chip = { name: 'Chip', props: { variant: 'solid' }, children: ['a'] }
    const drawn = checkDrawn({ name: 'Sheet', props: {}, children: [chip, chip] }, PAGE)
    expect(drawn).toEqual({ reason: expect.stringMatching(/^<Chip> prop variant: "solid"[^;]*$/) })
    const noticed = withNotice(literalOnly(PAGE), 'it stopped')
    expect(noticed.children[0]).toMatchObject({
      name: 'Callout',
      props: { tone: 'warning' },
      children: [{ value: 'it stopped' }],
    })
  })

  test('before it runs, or where it cannot, only what is literal draws', () => {
    const root = parse(`function Kpi() { return null }
<Sheet title="t"><Title>Hi</Title><Stat label="n" value={n} /><Kpi />{rows.map((r) => r)}<Text>plain</Text></Sheet>`)
    expect(literalOnly(root)).toEqual({
      kind: 'element',
      name: 'Sheet',
      props: { title: 't' },
      children: [
        { kind: 'element', name: 'Title', props: {}, children: [{ kind: 'text', value: 'Hi' }] },
        { kind: 'element', name: 'Text', props: {}, children: [{ kind: 'text', value: 'plain' }] },
      ],
    })
  })
})
