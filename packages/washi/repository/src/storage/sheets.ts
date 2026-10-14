import {
  positionBetween,
  type SearchHit,
  type SheetDetail,
  type SheetSummary,
  type SheetWrite,
} from '@washi/domain'
import { sheetLinkTable, sheetTable } from '@washi/domain/db'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { newId, type Workspace } from './client'
import { createSnapshot, updateSnapshot } from './loro'
import { appendOp } from './oplog'
import { lastChildPosition, liveSubtree } from './sheet-tree'

export interface SheetIndexInput {
  /** Plain text + outbound refs, extracted by the service before persist. */
  body: string
  refs: string[]
}

export function listSheets(ws: Workspace): SheetSummary[] {
  return ws.db
    .select({
      id: sheetTable.id,
      title: sheetTable.title,
      icon: sheetTable.icon,
      tags: sheetTable.tags,
      parentId: sheetTable.parentId,
      position: sheetTable.position,
      hlcUpdated: sheetTable.hlcUpdated,
    })
    .from(sheetTable)
    .where(isNull(sheetTable.deletedAt))
    .orderBy(desc(sheetTable.hlcUpdated))
    .all()
}

export function getSheet(ws: Workspace, id: string): SheetDetail | null {
  const [row] = ws.db
    .select()
    .from(sheetTable)
    .where(and(eq(sheetTable.id, id), isNull(sheetTable.deletedAt)))
    .all()
  if (!row) return null
  const { loroSnapshot: _snapshot, deletedAt: _deleted, ...detail } = row
  return detail
}

/** A new page lands last among its siblings, as in Notion. The caller vouches for the parent. */
export function createSheet(
  ws: Workspace,
  write: SheetWrite,
  index: SheetIndexInput,
  parentId: string | null = null,
): SheetDetail {
  const now = ws.now()
  const id = newId()
  ws.db
    .insert(sheetTable)
    .values({
      id,
      parentId,
      position: positionBetween(lastChildPosition(ws, parentId), null),
      title: write.title,
      icon: write.icon ?? null,
      tags: write.tags ?? [],
      source: write.source,
      loroSnapshot: Buffer.from(createSnapshot(write.source)),
      hlcCreated: now,
      hlcUpdated: now,
    })
    .run()
  indexSheet(ws, id, write.title, index)
  appendOp(ws, 'sheet', id, { kind: 'create', parentId, ...write })
  return getSheet(ws, id) as SheetDetail
}

export function updateSheet(
  ws: Workspace,
  id: string,
  write: SheetWrite,
  index: SheetIndexInput,
): SheetDetail | null {
  const [existing] = ws.db.select().from(sheetTable).where(eq(sheetTable.id, id)).all()
  if (!existing || existing.deletedAt) return null

  ws.db
    .update(sheetTable)
    .set({
      title: write.title,
      icon: write.icon ?? null,
      tags: write.tags ?? existing.tags,
      source: write.source,
      loroSnapshot: Buffer.from(updateSnapshot(existing.loroSnapshot, write.source)),
      hlcUpdated: ws.now(),
    })
    .where(eq(sheetTable.id, id))
    .run()
  indexSheet(ws, id, write.title, index)
  appendOp(ws, 'sheet', id, { kind: 'update', ...write })
  return getSheet(ws, id)
}

/** Sub-pages go to the Trash with their page, under one stamp, so Restore brings back the set. */
export function deleteSheet(ws: Workspace, id: string): boolean {
  const ids = liveSubtree(ws, id)
  if (ids.length === 0) return false
  const stamp = ws.now()
  const trash = ws.sqlite.query('UPDATE sheets SET deleted_at = ? WHERE id = ?')
  ws.sqlite.transaction(() => {
    for (const each of ids) {
      trash.run(stamp, each)
      ws.sqlite.query('DELETE FROM sheets_fts WHERE id = ?').run(each)
      ws.db.delete(sheetLinkTable).where(eq(sheetLinkTable.src, each)).run()
    }
    appendOp(ws, 'sheet', id, { kind: 'delete', ids })
  })()
  return true
}

export function getBacklinks(ws: Workspace, id: string): SheetSummary[] {
  const sources = ws.db
    .select({ src: sheetLinkTable.src })
    .from(sheetLinkTable)
    .where(eq(sheetLinkTable.dst, id))
    .all()
  const ids = new Set(sources.map((row) => row.src))
  return listSheets(ws).filter((sheet) => ids.has(sheet.id))
}

export function searchSheets(ws: Workspace, term: string, limit = 20): SearchHit[] {
  const cleaned = term.replace(/["]/g, '').trim()
  if (!cleaned) return []
  const match = cleaned
    .split(/\s+/)
    .map((token) => `"${token}"*`)
    .join(' ')
  return ws.sqlite
    .query(
      `SELECT id, title, snippet(sheets_fts, 2, '', '', '…', 12) AS snippet
       FROM sheets_fts WHERE sheets_fts MATCH ? LIMIT ?`,
    )
    .all(match, limit)
    .map((row) => {
      const hit = row as { id: string; title: string; snippet: string }
      const sheet = getSheet(ws, hit.id)
      return { id: hit.id, title: hit.title, icon: sheet?.icon ?? null, snippet: hit.snippet }
    })
}

export function indexSheet(ws: Workspace, id: string, title: string, index: SheetIndexInput) {
  ws.sqlite.query('DELETE FROM sheets_fts WHERE id = ?').run(id)
  ws.sqlite
    .query('INSERT INTO sheets_fts (id, title, body) VALUES (?, ?, ?)')
    .run(id, title, index.body)

  ws.db.delete(sheetLinkTable).where(eq(sheetLinkTable.src, id)).run()
  for (const dst of index.refs) {
    ws.db.insert(sheetLinkTable).values({ src: id, dst }).onConflictDoNothing().run()
  }
}
