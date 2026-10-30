import { describe, expect, test } from 'bun:test'
import { parse } from '@washi/wsx'
import type { WidgetMessage, WidgetPage } from '../../../lib/types'
import type { PaperHost } from '../../../provider'
import { checkDrawn, literalOnly } from '../../program/lib/utils'
import {
  answerAsk,
  applyWrite,
  frameHeight,
  isAsk,
  isPressed,
  isWrite,
  widgetCsp,
  widgetDocument,
} from '../lib/utils'

function harness(values: WidgetPage['values'] = {}) {
  const calls: string[] = []
  const host = {
    pageId: 'p1',
    runQuery: async (query: unknown) => ({ rows: [{ id: 'r1', query }] }),
    describeTable: async (name: string) => ({ name, columns: [] }),
    describeMe: async () => ({ id: 'u1', name: 'Juan' }),
    listPages: (parent: string) => [{ id: `${parent}-child`, title: 'Child' }],
    openSheet: (id: string) => void calls.push(`open ${id}`),
    runAction: async (action: unknown) => void calls.push(`act ${JSON.stringify(action)}`),
    readFile: async (key: string) => {
      if (key !== 'file:a') throw new Error(`${key} is not an upload you can open`)
      return new TextEncoder().encode('{"n":1}')
    },
  } as unknown as PaperHost
  const page: WidgetPage = {
    host,
    values,
    set: (key, value) => void calls.push(`set ${key}=${JSON.stringify(value)}`),
  }
  return { page, calls }
}

const ask = (message: WidgetMessage) => {
  if (!isAsk(message)) throw new Error(`${message.type} is not an ask`)
  return message
}

describe('a widget’s frame and its page (D113)', () => {
  test('reads are answered as the reader, exactly as page code reads', async () => {
    const { page } = harness()
    const query = { table: 'tasks' }
    expect(await answerAsk(ask({ type: 'rows', id: 1, query }), page)).toEqual([
      { id: 'r1', query },
    ])
    expect(await answerAsk(ask({ type: 'table', id: 2, name: 'tasks' }), page)).toEqual({
      name: 'tasks',
      columns: [],
    })
    expect(await answerAsk(ask({ type: 'pages', id: 3, of: '' }), page)).toEqual([
      { id: 'p1-child', title: 'Child' },
    ])
    expect(await answerAsk(ask({ type: 'me', id: 4 }), page)).toEqual({ id: 'u1', name: 'Juan' })
    expect(await answerAsk(ask({ type: 'members', id: 5 }), page)).toEqual([])
  })

  test('useFile reads an upload as the reader may, or says why not (D119)', async () => {
    const { page } = harness()
    const file = (key: string, as: string) => ask({ type: 'file', id: 9, key, as })
    expect(await answerAsk(file('file:a', 'json'), page)).toEqual({ ok: true, value: { n: 1 } })
    expect(await answerAsk(file('file:a', 'text'), page)).toEqual({ ok: true, value: '{"n":1}' })
    const bytes = (await answerAsk(file('file:a', 'bytes'), page)) as { value: Uint8Array }
    expect(bytes.value.length).toBe(7)
    expect(await answerAsk(file('file:z', 'text'), page)).toEqual({
      ok: false,
      error: 'file:z is not an upload you can open',
    })
  })

  test('a read that fails answers empty, never throws into the frame', async () => {
    const { page } = harness()
    page.host.runQuery = async () => {
      throw new Error('no such table')
    }
    expect(await answerAsk(ask({ type: 'rows', id: 1, query: {} }), page)).toEqual([])
  })

  test('writes land as the page’s own, state only as scalars', () => {
    const { page, calls } = harness()
    const writes: WidgetMessage[] = [
      { type: 'set', key: 'mode', value: 'week' },
      { type: 'set', key: 'list', value: [1, 2] },
      { type: 'act', action: { verb: 'table.insert', table: 'tasks', data: {} } },
      { type: 'navigate', id: 'p2' },
    ]
    for (const write of writes) if (isWrite(write)) applyWrite(write, page)
    expect(calls).toEqual([
      'set mode="week"',
      'act {"verb":"table.insert","table":"tasks","data":{}}',
      'open p2',
    ])
  })

  test('no frame, no press: a write needs the person’s own gesture inside it', () => {
    expect(isPressed(null)).toBe(false)
    expect(isWrite({ type: 'height', value: 10 })).toBe(false)
    expect(isAsk({ type: 'set', key: 'mode', value: 'week' })).toBe(false)
  })

  test('the frame’s document holds the bundle whole, a closing script tag defused', () => {
    const doc = widgetDocument('const a = "</script><b>"')
    expect(doc).toContain("default-src 'none'")
    expect(doc).toContain('const a = "<\\/script><b>"')
    expect(doc.match(/<\/script>/g)?.length).toBe(2)
  })

  test('no hosts listed: no network at all (the default)', () => {
    const csp = widgetCsp()
    expect(csp).toContain("default-src 'none'")
    expect(csp).not.toContain('connect-src')
    expect(csp).toContain('img-src data: blob:;')
    expect(csp).not.toContain('https')
  })

  test('a listed host is reachable over https and wss, a *.domain with its subdomains', () => {
    expect(widgetCsp(['api.example.com', '*.cdn.dev'])).toBe(
      [
        "default-src 'none'",
        "script-src 'unsafe-inline'",
        "style-src 'unsafe-inline'",
        'img-src data: blob: https://api.example.com https://cdn.dev https://*.cdn.dev',
        'font-src data: https://api.example.com https://cdn.dev https://*.cdn.dev',
        'media-src data: blob: https://api.example.com https://cdn.dev https://*.cdn.dev',
        'connect-src https://api.example.com https://cdn.dev https://*.cdn.dev wss://api.example.com wss://cdn.dev wss://*.cdn.dev',
        "form-action 'none'",
        "base-uri 'none'",
      ].join('; '),
    )
  })

  test('* is every https and wss site; a malformed entry never reaches the policy', () => {
    const any = widgetCsp(['*'])
    expect(any).toContain('connect-src https: wss:')
    expect(any).toContain('img-src data: blob: https:;')
    const spliced = widgetCsp(["evil.dev; script-src 'unsafe-eval'", 'ok.dev'])
    expect(spliced).not.toContain('evil.dev')
    expect(spliced).toContain('connect-src https://ok.dev wss://ok.dev')
    expect(widgetDocument('x', ['ok.dev'])).toContain('connect-src https://ok.dev')
  })

  test('before the page runs, and once it draws, the Widget still names its component', () => {
    const page = parse(
      `function Clock() { return <div /> }\n<Sheet title="t"><Widget title="c"><Clock size={2} /></Widget></Sheet>`,
    )
    expect(literalOnly(page).children[0]).toMatchObject({
      name: 'Widget',
      children: [{ name: 'Clock', props: { size: 2 } }],
    })
    const drawn = {
      name: 'Sheet',
      props: {},
      children: [{ name: 'Widget', props: {}, children: [{ name: 'Clock', props: { size: 4 } }] }],
    }
    expect(checkDrawn(drawn, page)).toMatchObject({
      root: { children: [{ name: 'Widget', children: [{ name: 'Clock', props: { size: 4 } }] }] },
    })
  })
})

describe('a widget is as tall as what it draws', () => {
  test('height is the least it takes, never a cut', () => {
    expect(frameHeight(320, 565)).toBe(565)
    expect(frameHeight(320, 120)).toBe(320)
    expect(frameHeight(undefined, 200)).toBe(200)
  })
})
