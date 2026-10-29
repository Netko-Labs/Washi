import { expect, test } from 'bun:test'
import { openWorkspace } from '../storage/client'

// The studio bundles this package twice (Nitro's entry and the SSR router). A query string
// makes Bun load a second, separate copy of the module — the same split, in one test.
type RecordWrites = typeof import('../storage/record-writes')
const copyOf = (bundle: string) =>
  import(`../storage/record-writes?copy=${bundle}`) as Promise<RecordWrites>
const first = await copyOf('nitro')
const second = await copyOf('ssr')

test('a write told through one copy reaches a listener set through the other', () => {
  expect(first).not.toBe(second)
  const ws = openWorkspace({ id: 'two-copies', path: ':memory:' })
  const heard: string[] = []
  first.onRecordWrite(ws, (write) => heard.push(write.recordId))
  second.tellRecordWrite(ws, {
    kind: 'insert',
    tableId: 'tasks',
    recordId: 'r1',
    data: {},
    before: null,
    author: null,
  })
  expect(heard).toEqual(['r1'])
  ws.close()
})
