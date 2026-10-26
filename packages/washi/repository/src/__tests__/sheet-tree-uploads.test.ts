import { describe, expect, test } from 'bun:test'
import { createSheet, deleteSheet, openWorkspace, trashedUploads, updateSheetMeta } from '..'

function pageWearing(
  ws: ReturnType<typeof openWorkspace>,
  meta: { cover?: string; icon?: string },
) {
  const sheet = createSheet(ws, { title: 'p', source: '...' }, { body: 'p', refs: [] })
  updateSheetMeta(ws, sheet.id, meta)
  return sheet.id
}

describe('trashedUploads', () => {
  test('a purge frees only what no other page wears', () => {
    const ws = openWorkspace({ id: 'w', path: ':memory:' })
    const shared = pageWearing(ws, { cover: 'file:shared' })
    const live = pageWearing(ws, { cover: 'file:shared' })
    const alone = pageWearing(ws, { cover: 'file:alone' })
    const later = pageWearing(ws, { cover: 'file:later' })
    deleteSheet(ws, shared)
    deleteSheet(ws, alone)
    const batch = trashedUploads(ws, alone)
    expect(batch).toEqual(['alone'])
    deleteSheet(ws, later)
    // the first batch's shared cover is still worn by the live copy; later is another batch
    expect(trashedUploads(ws, shared)).toEqual([])
    expect(trashedUploads(ws).sort()).toEqual(['alone', 'later'])
    expect(live).toBeTruthy()
    ws.close()
  })

  test('an icon upload is freed like a cover, and kept while any page wears it either way', () => {
    const ws = openWorkspace({ id: 'w', path: ':memory:' })
    const iconOnly = pageWearing(ws, { icon: 'file:fox' })
    pageWearing(ws, { cover: 'file:both' })
    const iconToo = pageWearing(ws, { icon: 'file:both' })
    deleteSheet(ws, iconOnly)
    deleteSheet(ws, iconToo)
    expect(trashedUploads(ws, iconOnly)).toEqual(['fox'])
    // `both` is a live page's cover, so trashing the page wearing it as an icon keeps it
    expect(trashedUploads(ws, iconToo)).toEqual([])
    ws.close()
  })
})
