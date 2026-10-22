import { describe, expect, test } from 'bun:test'
import { createSheet, deleteSheet, openWorkspace, trashedFileCovers, updateSheetMeta } from '..'

function pageWithCover(ws: ReturnType<typeof openWorkspace>, cover: string) {
  const sheet = createSheet(ws, { title: 'p', source: '...' }, { body: 'p', refs: [] })
  updateSheetMeta(ws, sheet.id, { cover })
  return sheet.id
}

describe('trashedFileCovers', () => {
  test('a purge frees only what no other page wears', () => {
    const ws = openWorkspace({ id: 'w', path: ':memory:' })
    const shared = pageWithCover(ws, 'file:shared')
    const live = pageWithCover(ws, 'file:shared')
    const alone = pageWithCover(ws, 'file:alone')
    const later = pageWithCover(ws, 'file:later')
    deleteSheet(ws, shared)
    deleteSheet(ws, alone)
    const batch = trashedFileCovers(ws, alone)
    expect(batch).toEqual(['alone'])
    deleteSheet(ws, later)
    // the first batch's shared cover is still worn by the live copy; later is another batch
    expect(trashedFileCovers(ws, shared)).toEqual([])
    expect(trashedFileCovers(ws).sort()).toEqual(['alone', 'later'])
    expect(live).toBeTruthy()
    ws.close()
  })
})
