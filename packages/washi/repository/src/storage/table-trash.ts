import type { TrashedTable } from '@washi/domain'
import type { Workspace } from './client'
import { appendOp } from './oplog'
import { purgeSheetIds } from './sheet-tree'

/** Trashing a table stamps the table alone: its rows and their history stay as they are (P1). */
export function trashTable(ws: Workspace, id: string): boolean {
  const result = ws.sqlite
    .query('UPDATE user_tables SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL')
    .run(ws.now(), id)
  if (result.changes === 0) return false
  appendOp(ws, 'table', id, { kind: 'trash' })
  return true
}

export function restoreTable(ws: Workspace, id: string): boolean {
  const result = ws.sqlite
    .query('UPDATE user_tables SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL')
    .run(id)
  if (result.changes === 0) return false
  appendOp(ws, 'table', id, { kind: 'restore' })
  return true
}

export function listTrashedTables(ws: Workspace): TrashedTable[] {
  return ws.sqlite
    .query(
      `SELECT t.id, t.name, t.deleted_at AS deletedAt,
         (SELECT COUNT(*) FROM records r WHERE r.table_id = t.id AND r.deleted_at IS NULL) AS rows
       FROM user_tables t WHERE t.deleted_at IS NOT NULL ORDER BY t.deleted_at DESC`,
    )
    .all() as TrashedTable[]
}

/** Names stay unique in the Trash too: a new table may not take a trashed one's name. */
export function isTableNameTrashed(ws: Workspace, name: string): boolean {
  return Boolean(
    ws.sqlite
      .query('SELECT 1 FROM user_tables WHERE name = ? AND deleted_at IS NOT NULL')
      .get(name),
  )
}

/**
 * A trashed table gone for good: its rows, their history and their row pages. This is the one
 * write that erases records outside the P1 functions — nothing is left for history to keep.
 */
export function purgeTable(ws: Workspace, id: string): boolean {
  const trashed = ws.sqlite
    .query('SELECT 1 FROM user_tables WHERE id = ? AND deleted_at IS NOT NULL')
    .get(id)
  if (!trashed) return false
  const rowPages = ws.sqlite
    .query('SELECT s.id FROM sheets s JOIN records r ON r.id = s.row_id WHERE r.table_id = ?')
    .all(id) as { id: string }[]
  ws.sqlite.transaction(() => {
    purgeSheetIds(
      ws,
      rowPages.map((page) => page.id),
    )
    ws.sqlite.query('DELETE FROM record_changes WHERE table_id = ?').run(id)
    ws.sqlite.query('DELETE FROM records WHERE table_id = ?').run(id)
    ws.sqlite.query('DELETE FROM user_tables WHERE id = ?').run(id)
    appendOp(ws, 'table', id, { kind: 'purge' })
  })()
  return true
}
