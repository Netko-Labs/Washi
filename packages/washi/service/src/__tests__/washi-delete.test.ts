import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { getSheet, listTrash, openWorkspace, type Workspace } from '@washi/repository'
import { pageCapabilities } from '../capabilities'
import { NOBODY, SheetAccessError, SheetNotFoundError } from '../sheets/access'
import { createSheetFromSource } from '../sheets/service'
import { restoreSheetTree } from '../sheets/tree'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
})
afterEach(() => ws.close())

const RIN = { id: 'rin', isOwner: false }
const KENJI = { id: 'kenji', isOwner: false }

const page = (title: string, parentId: string | null = null, props = '') =>
  createSheetFromSource(
    ws,
    { title, source: `<Sheet title="${title}"${props}><Text>${title}</Text></Sheet>` },
    parentId,
  )

const deleteAs = (viewer: { id: string | null; isOwner: boolean }, id: string) => {
  const tool = pageCapabilities(ws, { viewer, author: 'washi' }).find(
    (each) => each.name === 'sheet_delete',
  )
  if (!tool) throw new Error('no sheet_delete')
  return tool.run({ id })
}

describe('Washi deletes a page when asked (D108)', () => {
  test('the page goes to the Trash with its subtree, one batch', async () => {
    const trip = page('Trip')
    const day = page('Day one', trip.id)
    page('Morning', day.id)
    expect(await deleteAs(RIN, trip.id)).toEqual({ id: trip.id, title: 'Trip', pages: 3 })
    expect(getSheet(ws, day.id)).toBeNull()
    expect(listTrash(ws)).toMatchObject([{ id: trip.id, nestedCount: 2 }])
  })

  test('a page the asker cannot read does not exist for the call', async () => {
    const plan = page('Plan', null, ' visibility="private" access={["rin"]}')
    await expect(deleteAs(KENJI, plan.id)).rejects.toBeInstanceOf(SheetNotFoundError)
    expect(getSheet(ws, plan.id)).not.toBeNull()
  })

  test('a routine deletes nothing', async () => {
    const notes = page('Notes')
    await expect(deleteAs(NOBODY, notes.id)).rejects.toBeInstanceOf(SheetAccessError)
    expect(getSheet(ws, notes.id)).not.toBeNull()
  })

  test('a page on a public link stays until a person takes it down', async () => {
    const board = page('Board')
    page('Launch', board.id, ' visibility="public"')
    await expect(deleteAs(RIN, board.id)).rejects.toBeInstanceOf(SheetAccessError)
    expect(getSheet(ws, board.id)).not.toBeNull()
  })

  test('restore brings the whole subtree back', async () => {
    const trip = page('Trip')
    const day = page('Day one', trip.id)
    await deleteAs(RIN, trip.id)
    expect(restoreSheetTree(ws, trip.id, 'rin')).toHaveLength(2)
    expect(getSheet(ws, day.id)?.parentId).toBe(trip.id)
    expect(listTrash(ws)).toHaveLength(0)
  })
})
