import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
  deleteSheet,
  getBacklinks,
  getSheet,
  openWorkspace,
  searchSheets,
  type Workspace,
} from '@washi/repository'
import { createSheetFromSource } from '../sheets/service'
import { moveSheetTo, restoreSheetTree, SheetMoveError } from '../sheets/tree'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
})
afterEach(() => ws.close())

const page = (title: string, body: string, parentId: string | null = null) =>
  createSheetFromSource(
    ws,
    { title, source: `<Sheet title="${title}"><Text>${body}</Text></Sheet>` },
    parentId,
  )

describe('page tree rules', () => {
  test('a page cannot move inside itself or its own sub-pages', () => {
    const projects = page('Projects', 'all of them')
    const alpha = page('Alpha', 'first', projects.id)
    expect(() => moveSheetTo(ws, projects.id, projects.id, 0)).toThrow(SheetMoveError)
    expect(() => moveSheetTo(ws, projects.id, alpha.id, 0)).toThrow(SheetMoveError)
    moveSheetTo(ws, alpha.id, null, 0)
    expect(getSheet(ws, alpha.id)?.parentId).toBeNull()
  })

  test('a sub-page needs a live parent', () => {
    const gone = page('Gone', 'soon')
    deleteSheet(ws, gone.id)
    expect(() => page('Orphan', 'nowhere', gone.id)).toThrow()
    expect(() => moveSheetTo(ws, page('Loose', 'x').id, gone.id, 0)).toThrow()
  })

  test('restore puts pages back in search and backlinks', () => {
    const target = page('Target', 'goblin manifesto')
    const linker = createSheetFromSource(
      ws,
      {
        title: 'Linker',
        source: `<Sheet title="Linker"><Text>see <Ref sheet="${target.id}">target</Ref></Text></Sheet>`,
      },
      target.id,
    )
    deleteSheet(ws, target.id)
    expect(searchSheets(ws, 'goblin')).toHaveLength(0)

    expect(restoreSheetTree(ws, target.id)).toHaveLength(2)
    expect(searchSheets(ws, 'goblin')[0]?.id).toBe(target.id)
    expect(getBacklinks(ws, target.id).map((sheet) => sheet.id)).toEqual([linker.id])
  })
})
