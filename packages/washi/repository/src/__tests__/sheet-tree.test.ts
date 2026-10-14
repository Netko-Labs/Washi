import { Database } from 'bun:sqlite'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  ancestorIds,
  createSheet,
  deleteSheet,
  emptyTrash,
  getSheet,
  listSheets,
  listTrash,
  moveSheet,
  openWorkspace,
  purgeSheet,
  restoreSheet,
  searchSheets,
  type Workspace,
} from '../index'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
})
afterEach(() => ws.close())

const page = (title: string, parentId: string | null = null) =>
  createSheet(ws, { title, source: '...' }, { body: title, refs: [] }, parentId)

function childrenOf(parentId: string | null): string[] {
  return listSheets(ws)
    .filter((sheet) => sheet.parentId === parentId)
    .sort((a, b) => (a.position < b.position ? -1 : 1))
    .map((sheet) => sheet.title)
}

describe('page tree', () => {
  test('a new page lands last among its siblings', () => {
    const projects = page('Projects')
    page('Alpha', projects.id)
    page('Beta', projects.id)
    page('Inbox')
    expect(childrenOf(null)).toEqual(['Projects', 'Inbox'])
    expect(childrenOf(projects.id)).toEqual(['Alpha', 'Beta'])
  })

  test('move reorders and re-parents', () => {
    const projects = page('Projects')
    const alpha = page('Alpha')
    const beta = page('Beta')
    expect(moveSheet(ws, beta.id, null, 0)).toBe(true)
    expect(childrenOf(null)).toEqual(['Beta', 'Projects', 'Alpha'])

    moveSheet(ws, alpha.id, projects.id, 0)
    moveSheet(ws, beta.id, projects.id, 0)
    expect(childrenOf(projects.id)).toEqual(['Beta', 'Alpha'])
    expect(ancestorIds(ws, alpha.id)).toEqual([alpha.id, projects.id])
  })

  test('delete trashes the subtree as one entry; restore brings it all back', () => {
    const projects = page('Projects')
    const alpha = page('Alpha', projects.id)
    page('Deep', alpha.id)
    page('Kept')

    deleteSheet(ws, projects.id)
    expect(childrenOf(null)).toEqual(['Kept'])
    expect(searchSheets(ws, 'Deep')).toHaveLength(0)
    expect(listTrash(ws).map((entry) => [entry.title, entry.nestedCount])).toEqual([
      ['Projects', 2],
    ])

    expect(restoreSheet(ws, projects.id)).toHaveLength(3)
    expect(childrenOf(projects.id)).toEqual(['Alpha'])
    expect(getSheet(ws, alpha.id)?.parentId).toBe(projects.id)
    expect(listTrash(ws)).toHaveLength(0)
  })

  test('a page trashed on its own comes back to the top when its parent is gone', () => {
    const projects = page('Projects')
    const alpha = page('Alpha', projects.id)
    deleteSheet(ws, alpha.id)
    deleteSheet(ws, projects.id)
    expect(listTrash(ws).map((entry) => entry.title)).toEqual(['Projects', 'Alpha'])

    restoreSheet(ws, alpha.id)
    expect(getSheet(ws, alpha.id)?.parentId).toBeNull()
    expect(childrenOf(null)).toEqual(['Alpha'])
  })

  test('purge and empty delete for good', () => {
    const projects = page('Projects')
    page('Alpha', projects.id)
    const loose = page('Loose')
    deleteSheet(ws, projects.id)
    deleteSheet(ws, loose.id)

    expect(purgeSheet(ws, projects.id)).toBe(2)
    expect(listTrash(ws).map((entry) => entry.title)).toEqual(['Loose'])
    expect(emptyTrash(ws)).toBe(1)
    const left = ws.sqlite.query('SELECT COUNT(*) AS n FROM sheets').get() as { n: number }
    expect(left.n).toBe(0)
  })
})

describe('positions for pages made before nesting', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'washi-tree-'))
  })
  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  test('are backfilled most recently edited first', () => {
    const path = join(dir, 'old.db')
    const old = new Database(path)
    old.exec(`CREATE TABLE sheets (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, icon TEXT, tags TEXT NOT NULL DEFAULT '[]',
      source TEXT NOT NULL, loro_snapshot BLOB NOT NULL, hlc_created TEXT NOT NULL,
      hlc_updated TEXT NOT NULL, deleted_at TEXT)`)
    const insert = old.query(
      "INSERT INTO sheets (id, title, source, loro_snapshot, hlc_created, hlc_updated) VALUES (?, ?, '...', x'00', ?, ?)",
    )
    insert.run('a', 'Older', '001', '001')
    insert.run('b', 'Newer', '002', '002')
    old.close()

    const reopened = openWorkspace({ id: 'old', path })
    const order = listSheets(reopened)
      .sort((x, y) => (x.position < y.position ? -1 : 1))
      .map((sheet) => sheet.title)
    reopened.close()
    expect(order).toEqual(['Newer', 'Older'])
  })
})
