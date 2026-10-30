import { describe, expect, test } from 'bun:test'
import { parse } from '@washi/wsx'
import type { WidgetMessage, WidgetPage } from '../../../lib/types'
import type { PaperHost } from '../../../provider'
import { checkDrawn, literalOnly } from '../../program/lib/utils'
import { answerAsk, applyWrite, isAsk, isPressed, isWrite, widgetDocument } from '../lib/utils'

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
