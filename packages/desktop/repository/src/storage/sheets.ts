import type { SearchHit, SheetDetail, SheetSummary, SheetWrite } from '@washi/desktop-domain'
import { sheetLinkTable, sheetTable } from '@washi/desktop-domain/db'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { getDb, getSqlite, hlcNow, newId } from './client'
import { createSnapshot, updateSnapshot } from './loro'
import { appendOp } from './oplog'

export interface SheetIndexInput {
  /** Plain text + outbound refs, extracted by the service before persist. */
  body: string
  refs: string[]
}

export function listSheets(): SheetSummary[] {
  return getDb()
    .select({
      id: sheetTable.id,
      title: sheetTable.title,
      icon: sheetTable.icon,
      tags: sheetTable.tags,
      hlcUpdated: sheetTable.hlcUpdated,
    })
    .from(sheetTable)
    .where(isNull(sheetTable.deletedAt))
    .orderBy(desc(sheetTable.hlcUpdated))
    .all()
}

export function getSheet(id: string): SheetDetail | null {
  const [row] = getDb()
    .select()
    .from(sheetTable)
    .where(and(eq(sheetTable.id, id), isNull(sheetTable.deletedAt)))
    .all()
  if (!row) return null
  const { loroSnapshot: _snapshot, deletedAt: _deleted, ...detail } = row
  return detail
}

export function createSheet(write: SheetWrite, index: SheetIndexInput): SheetDetail {
  const now = hlcNow()
  const id = newId()
  getDb()
    .insert(sheetTable)
    .values({
      id,
      title: write.title,
      icon: write.icon ?? null,
      tags: write.tags ?? [],
      source: write.source,
      loroSnapshot: Buffer.from(createSnapshot(write.source)),
      hlcCreated: now,
      hlcUpdated: now,
    })
    .run()
  reindexSheet(id, write.title, index)
  appendOp('sheet', id, { kind: 'create', ...write })
  return getSheet(id) as SheetDetail
}

export function updateSheet(
  id: string,
  write: SheetWrite,
  index: SheetIndexInput,
): SheetDetail | null {
  const db = getDb()
  const [existing] = db.select().from(sheetTable).where(eq(sheetTable.id, id)).all()
  if (!existing || existing.deletedAt) return null

  db.update(sheetTable)
    .set({
      title: write.title,
      icon: write.icon ?? null,
      tags: write.tags ?? existing.tags,
      source: write.source,
      loroSnapshot: Buffer.from(updateSnapshot(existing.loroSnapshot, write.source)),
      hlcUpdated: hlcNow(),
    })
    .where(eq(sheetTable.id, id))
    .run()
  reindexSheet(id, write.title, index)
  appendOp('sheet', id, { kind: 'update', ...write })
  return getSheet(id)
}

export function deleteSheet(id: string): boolean {
  const result = getSqlite()
    .query('UPDATE sheets SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL')
    .run(hlcNow(), id)
  if (result.changes === 0) return false
  getSqlite().query('DELETE FROM sheets_fts WHERE id = ?').run(id)
  getDb().delete(sheetLinkTable).where(eq(sheetLinkTable.src, id)).run()
  appendOp('sheet', id, { kind: 'delete' })
  return true
}

export function getBacklinks(id: string): SheetSummary[] {
  const sources = getDb()
    .select({ src: sheetLinkTable.src })
    .from(sheetLinkTable)
    .where(eq(sheetLinkTable.dst, id))
    .all()
  const ids = new Set(sources.map((row) => row.src))
  return listSheets().filter((sheet) => ids.has(sheet.id))
}

export function searchSheets(term: string, limit = 20): SearchHit[] {
  const cleaned = term.replace(/["]/g, '').trim()
  if (!cleaned) return []
  const match = cleaned
    .split(/\s+/)
    .map((token) => `"${token}"*`)
    .join(' ')
  return getSqlite()
    .query(
      `SELECT id, title, snippet(sheets_fts, 2, '', '', '…', 12) AS snippet
       FROM sheets_fts WHERE sheets_fts MATCH ? LIMIT ?`,
    )
    .all(match, limit)
    .map((row) => {
      const hit = row as { id: string; title: string; snippet: string }
      const sheet = getSheet(hit.id)
      return { id: hit.id, title: hit.title, icon: sheet?.icon ?? null, snippet: hit.snippet }
    })
}

function reindexSheet(id: string, title: string, index: SheetIndexInput) {
  const sqlite = getSqlite()
  sqlite.query('DELETE FROM sheets_fts WHERE id = ?').run(id)
  sqlite
    .query('INSERT INTO sheets_fts (id, title, body) VALUES (?, ?, ?)')
    .run(id, title, index.body)

  getDb().delete(sheetLinkTable).where(eq(sheetLinkTable.src, id)).run()
  for (const dst of index.refs) {
    getDb().insert(sheetLinkTable).values({ src: id, dst }).onConflictDoNothing().run()
  }
}
