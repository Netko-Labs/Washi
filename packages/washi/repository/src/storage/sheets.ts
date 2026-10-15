import {
  positionBetween,
  type SearchHit,
  type SheetAuthor,
  type SheetDetail,
  type SheetMetaPatch,
  type SheetSummary,
  type SheetWrite,
} from '@washi/domain'
import { sheetLinkTable, sheetTable } from '@washi/domain/db'
import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { newId, type Workspace } from './client'
import { createSnapshot, updateSnapshot } from './loro'
import { appendOp } from './oplog'
import { clearRevisions, pushRevision } from './revisions'
import { lastChildPosition, liveSubtree } from './sheet-tree'

export interface SheetIndexInput {
  /** Plain text + outbound refs, extracted by the service before persist. */
  body: string
  refs: string[]
}

const SUMMARY = {
  id: sheetTable.id,
  title: sheetTable.title,
  icon: sheetTable.icon,
  tags: sheetTable.tags,
  parentId: sheetTable.parentId,
  position: sheetTable.position,
  cover: sheetTable.cover,
  fullWidth: sheetTable.fullWidth,
  editedBy: sheetTable.editedBy,
  rowOf: sheetTable.rowId,
  // Drizzle renders a lone column unqualified here, and `id` would bind to the revision's.
  undoable:
    sql<boolean>`exists (select 1 from sheet_revisions r where r.sheet_id = sheets.id)`.mapWith(
      Boolean,
    ),
  hlcUpdated: sheetTable.hlcUpdated,
}

export function listSheets(ws: Workspace): SheetSummary[] {
  return ws.db
    .select(SUMMARY)
    .from(sheetTable)
    .where(isNull(sheetTable.deletedAt))
    .orderBy(desc(sheetTable.hlcUpdated))
    .all()
}

export function getSheet(ws: Workspace, id: string): SheetDetail | null {
  const [row] = ws.db
    .select({ ...SUMMARY, source: sheetTable.source, hlcCreated: sheetTable.hlcCreated })
    .from(sheetTable)
    .where(and(eq(sheetTable.id, id), isNull(sheetTable.deletedAt)))
    .all()
  return row ?? null
}

/** A new page lands last among its siblings, as in Notion. The caller vouches for the parent. */
export function createSheet(
  ws: Workspace,
  write: SheetWrite,
  index: SheetIndexInput,
  parentId: string | null = null,
  editedBy: SheetAuthor = null,
  rowId: string | null = null,
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
      editedBy,
      rowId,
      hlcCreated: now,
      hlcUpdated: now,
    })
    .run()
  indexSheet(ws, id, write.title, index)
  appendOp(ws, 'sheet', id, { kind: 'create', parentId, editedBy, ...write })
  return getSheet(ws, id) as SheetDetail
}

export function updateSheet(
  ws: Workspace,
  id: string,
  write: SheetWrite,
  index: SheetIndexInput,
  editedBy: SheetAuthor = null,
): SheetDetail | null {
  const [existing] = ws.db.select().from(sheetTable).where(eq(sheetTable.id, id)).all()
  if (!existing || existing.deletedAt) return null
  const changed =
    write.source !== existing.source ||
    write.title !== existing.title ||
    (write.icon ?? null) !== existing.icon

  ws.sqlite.transaction(() => {
    if (editedBy === 'washi') pushRevision(ws, existing)
    else if (changed) clearRevisions(ws, id)
    ws.db
      .update(sheetTable)
      .set({
        title: write.title,
        icon: write.icon ?? null,
        tags: write.tags ?? existing.tags,
        source: write.source,
        loroSnapshot: Buffer.from(updateSnapshot(existing.loroSnapshot, write.source)),
        editedBy: editedBy ?? (changed ? null : existing.editedBy),
        hlcUpdated: ws.now(),
      })
      .where(eq(sheetTable.id, id))
      .run()
    indexSheet(ws, id, write.title, index)
    appendOp(ws, 'sheet', id, { kind: 'update', editedBy, ...write })
  })()
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

/** Title, icon, cover and width — what a person edits around a page; its content is untouched. */
export function updateSheetMeta(
  ws: Workspace,
  id: string,
  patch: SheetMetaPatch,
): SheetDetail | null {
  const [existing] = ws.db
    .select({ deletedAt: sheetTable.deletedAt })
    .from(sheetTable)
    .where(eq(sheetTable.id, id))
    .all()
  if (!existing || existing.deletedAt) return null
  const { title, icon, cover, fullWidth } = patch
  const isEdit = title !== undefined || icon !== undefined || cover !== undefined
  if (!isEdit && fullWidth === undefined) return getSheet(ws, id)

  ws.db
    .update(sheetTable)
    .set({
      ...(title !== undefined && { title }),
      ...(icon !== undefined && { icon }),
      ...(cover !== undefined && { cover }),
      ...(fullWidth !== undefined && { fullWidth }),
      ...(isEdit && { hlcUpdated: ws.now() }),
    })
    .where(eq(sheetTable.id, id))
    .run()
  if (title !== undefined) {
    ws.sqlite.query('UPDATE sheets_fts SET title = ? WHERE id = ?').run(title, id)
  }
  appendOp(ws, 'sheet', id, { kind: 'meta', ...patch })
  return getSheet(ws, id)
}

/** The page that is a row's body, trashed or not — a row has one, ever. */
export function findRowSheet(
  ws: Workspace,
  rowId: string,
): { id: string; trashed: boolean } | null {
  const [row] = ws.db
    .select({ id: sheetTable.id, deletedAt: sheetTable.deletedAt })
    .from(sheetTable)
    .where(eq(sheetTable.rowId, rowId))
    .all()
  return row ? { id: row.id, trashed: row.deletedAt !== null } : null
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
