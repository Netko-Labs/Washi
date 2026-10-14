import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
  deleteSheet,
  getBacklinks,
  getSheet,
  listSheets,
  openWorkspace,
  searchSheets,
  updateSheetMeta,
  type Workspace,
} from '@washi/repository'
import { createSheetFromSource } from '../sheets/service'
import { duplicateSheet, moveSheetTo, restoreSheetTree, SheetMoveError } from '../sheets/tree'

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

describe('page chrome', () => {
  test('width is a view choice, not an edit; a rename is both and is searchable', () => {
    const sheet = page('Roadmap', 'plans')
    const widened = updateSheetMeta(ws, sheet.id, { fullWidth: true })
    expect(widened?.fullWidth).toBe(true)
    expect(widened?.hlcUpdated).toBe(sheet.hlcUpdated)

    const renamed = updateSheetMeta(ws, sheet.id, { title: 'Quarterly goblin plan', cover: 'sage' })
    expect(renamed?.cover).toBe('sage')
    expect(renamed?.hlcUpdated).not.toBe(sheet.hlcUpdated)
    expect(searchSheets(ws, 'quarterly')[0]?.id).toBe(sheet.id)
  })

  test('duplicate lands right after the original, under the same parent, with its look', () => {
    const projects = page('Projects', 'all')
    const alpha = page('Alpha', 'first', projects.id)
    page('Beta', 'second', projects.id)
    updateSheetMeta(ws, alpha.id, { cover: 'dusk', fullWidth: true })

    const copy = duplicateSheet(ws, alpha.id)
    expect(copy).toMatchObject({
      title: 'Alpha (copy)',
      parentId: projects.id,
      cover: 'dusk',
      fullWidth: true,
    })
    const order = listSheets(ws)
      .filter((sheet) => sheet.parentId === projects.id)
      .sort((a, b) => (a.position < b.position ? -1 : 1))
      .map((sheet) => sheet.title)
    expect(order).toEqual(['Alpha', 'Alpha (copy)', 'Beta'])
  })
})
