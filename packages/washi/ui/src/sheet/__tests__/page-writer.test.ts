import { describe, expect, mock, test } from 'bun:test'
import { parse, type WsxElement } from '@washi/wsx'

const saved: string[] = []
mock.module('../../api', () => ({
  api: {
    sheets: {
      update: {
        mutate: async ({ write }: { write: { source: string } }) => {
          saved.push(write.source)
          return { version: `v${saved.length}` }
        },
      },
    },
  },
}))
mock.module('../../stores', () => ({
  useSheetsStore: { getState: () => ({ refresh: async () => {} }) },
}))

const { pageWriter } = await import('../lib/utils')

const node = (label: string) =>
  ({
    kind: 'element',
    name: 'Text',
    props: {},
    children: [{ kind: 'text', value: label }],
  }) as WsxElement

describe('writing a loaded page, element by element', () => {
  test('a second edit before the reload builds on the first', async () => {
    const root = parse('<Sheet title="t"><Text>a</Text><Text>b</Text></Sheet>')
    const sheet = { id: 'p', title: 't', icon: null } as never
    const write = pageWriter(sheet, root)
    const [first, second] = root.children as WsxElement[]
    if (!first || !second) throw new Error('no blocks')
    void write(first, node('a1'))
    // The block was rendered from `first` and has not reloaded: it still names the old element.
    await write(first, node('a2'))
    void write(second, node('b1'))
    await write(second, node('b2'))
    expect(saved.at(-1)).toContain('<Text>a2</Text>')
    expect(saved.at(-1)).toContain('<Text>b2</Text>')
  })
})
