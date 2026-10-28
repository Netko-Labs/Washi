import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { createSheet, getBacklinks, openWorkspace, type Workspace } from '@washi/repository'
import { reindexPages } from '../sheets/reindex'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
})
afterEach(() => ws.close())

describe('reading old pages again', () => {
  test('links the index never saw are found once, and only once', () => {
    const target = createSheet(
      ws,
      { title: 'Budget', source: '<Sheet title="Budget"><Text>x</Text></Sheet>' },
      { body: '', refs: [] },
    )
    // Written before PageLink was indexed: the index holds no link.
    createSheet(
      ws,
      { title: 'Hub', source: `<Sheet title="Hub"><PageLink sheet="${target.id}" /></Sheet>` },
      { body: '', refs: [] },
    )
    expect(getBacklinks(ws, target.id)).toHaveLength(0)
    reindexPages(ws)
    expect(getBacklinks(ws, target.id).map((page) => page.title)).toEqual(['Hub'])
  })
})
