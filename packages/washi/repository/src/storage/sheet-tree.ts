import { positionBetween, type TrashEntry } from '@washi/domain'
import type { Workspace } from './client'
import { deleteSheetComments } from './comments'
import { appendOp } from './oplog'

/** Counts trashed siblings too, so a restored page never ties with one made since. */
export function lastChildPosition(ws: Workspace, parentId: string | null): string | null {
  const row = ws.sqlite
    .query('SELECT MAX(position) AS position FROM sheets WHERE parent_id IS ?')
    .get(parentId) as { position: string | null }
  return row.position
}

/** The page and every live page under it; empty when the page is missing or trashed. */
export function liveSubtree(ws: Workspace, id: string): string[] {
  const rows = ws.sqlite
    .query(
      `WITH RECURSIVE tree(id) AS (
         SELECT id FROM sheets WHERE id = ? AND deleted_at IS NULL
         UNION SELECT s.id FROM sheets s JOIN tree t ON s.parent_id = t.id WHERE s.deleted_at IS NULL
       ) SELECT id FROM tree`,
    )
    .all(id) as { id: string }[]
  return rows.map((row) => row.id)
}

/** The page itself, then its parent, up to the root. */
export function ancestorIds(ws: Workspace, id: string): string[] {
  const rows = ws.sqlite
    .query(
      `WITH RECURSIVE up(id, parent_id) AS (
         SELECT id, parent_id FROM sheets WHERE id = ?
         UNION SELECT s.id, s.parent_id FROM sheets s JOIN up ON s.id = up.parent_id
       ) SELECT id FROM up`,
    )
    .all(id) as { id: string }[]
  return rows.map((row) => row.id)
}

/** Places a page at `index` among its new siblings. The caller rules out cycles. */
export function moveSheet(
  ws: Workspace,
  id: string,
  parentId: string | null,
  index: number,
): boolean {
  const siblings = ws.sqlite
    .query(
      `SELECT position FROM sheets
       WHERE parent_id IS ? AND deleted_at IS NULL AND id != ? ORDER BY position, id`,
    )
    .all(parentId, id) as { position: string }[]
  const at = Math.max(0, Math.min(index, siblings.length))
  const position = positionBetween(
    siblings[at - 1]?.position ?? null,
    siblings[at]?.position ?? null,
  )
  const result = ws.sqlite
    .query('UPDATE sheets SET parent_id = ?, position = ? WHERE id = ? AND deleted_at IS NULL')
    .run(parentId, position, id)
  if (result.changes === 0) return false
  appendOp(ws, 'sheet', id, { kind: 'move', parentId, position })
  return true
}

/** One row per delete: the page that was trashed, with how many sub-pages went with it. */
export function listTrash(ws: Workspace): TrashEntry[] {
  return ws.sqlite
    .query(
      `SELECT s.id, s.title, s.icon, s.deleted_at AS deletedAt,
         (SELECT COUNT(*) FROM sheets c WHERE c.deleted_at = s.deleted_at AND c.id != s.id)
           AS nestedCount
       FROM sheets s LEFT JOIN sheets p ON p.id = s.parent_id
       WHERE s.deleted_at IS NOT NULL AND (p.id IS NULL OR p.deleted_at IS NOT s.deleted_at)
       ORDER BY s.deleted_at DESC`,
    )
    .all() as TrashEntry[]
}

function trashedBatch(ws: Workspace, id: string): { ids: string[]; parentId: string | null } {
  const root = ws.sqlite
    .query('SELECT parent_id, deleted_at FROM sheets WHERE id = ? AND deleted_at IS NOT NULL')
    .get(id) as { parent_id: string | null; deleted_at: string } | null
  if (!root) return { ids: [], parentId: null }
  const rows = ws.sqlite
    .query(
      `WITH RECURSIVE tree(id) AS (
         SELECT ?
         UNION SELECT s.id FROM sheets s JOIN tree t ON s.parent_id = t.id WHERE s.deleted_at = ?
       ) SELECT id FROM tree`,
    )
    .all(id, root.deleted_at) as { id: string }[]
  return { ids: rows.map((row) => row.id), parentId: root.parent_id }
}

/**
 * Brings back a trashed page and the sub-pages trashed with it. A page whose parent is gone
 * comes back at the top level. Returns the restored ids, which the caller reindexes.
 */
export function restoreSheet(ws: Workspace, id: string): string[] {
  const { ids, parentId } = trashedBatch(ws, id)
  if (ids.length === 0) return []
  const restore = ws.sqlite.query('UPDATE sheets SET deleted_at = NULL WHERE id = ?')
  ws.sqlite.transaction(() => {
    for (const each of ids) restore.run(each)
    if (parentId && liveSubtree(ws, parentId).length === 0) {
      ws.sqlite
        .query('UPDATE sheets SET parent_id = NULL, position = ? WHERE id = ?')
        .run(positionBetween(lastChildPosition(ws, null), null), id)
    }
    appendOp(ws, 'sheet', id, { kind: 'restore', ids })
  })()
  return ids
}

function purge(ws: Workspace, ids: string[]): number {
  ws.sqlite.transaction(() => {
    for (const id of ids) {
      ws.sqlite.query('DELETE FROM sheet_links WHERE src = ?').run(id)
      ws.sqlite.query('DELETE FROM sheet_files WHERE src = ?').run(id)
      ws.sqlite.query('DELETE FROM sheet_automations WHERE src = ?').run(id)
      ws.sqlite.query('DELETE FROM sheet_formulas WHERE src = ?').run(id)
      ws.sqlite.query('DELETE FROM sheets WHERE id = ?').run(id)
      ws.sqlite.query('DELETE FROM sheet_revisions WHERE sheet_id = ?').run(id)
      deleteSheetComments(ws, id)
      appendOp(ws, 'sheet', id, { kind: 'purge' })
    }
  })()
  return ids.length
}

/** Deletes a trashed page and its sub-pages for good. */
export function purgeSheet(ws: Workspace, id: string): number {
  return purge(ws, trashedBatch(ws, id).ids)
}

export function emptyTrash(ws: Workspace): number {
  const rows = ws.sqlite.query('SELECT id FROM sheets WHERE deleted_at IS NOT NULL').all() as {
    id: string
  }[]
  return purge(
    ws,
    rows.map((row) => row.id),
  )
}

// Every upload a page wears — cover, icon, or a block's file — with the batch that page sits in;
// `kept` is what the workspace's emojis hold, which no purge frees.
const WORN_FILES = `WITH worn AS (
  SELECT deleted_at, cover AS key FROM sheets WHERE cover LIKE 'file:%'
  UNION ALL
  SELECT deleted_at, icon AS key FROM sheets WHERE icon LIKE 'file:%'
  UNION ALL
  SELECT s.deleted_at, f.key FROM sheet_files f JOIN sheets s ON s.id = f.src
),
kept AS (SELECT 'file:' || file_id AS key FROM custom_emojis)`

/**
 * The uploads a trash batch's covers and icons point at and no other page still wears — a purge
 * frees them with the pages (D60). A duplicate shares its original's files, so a live copy keeps
 * them, and so does a page in another trash batch, and so does a workspace emoji.
 */
export function trashedUploads(ws: Workspace, id?: string): string[] {
  const rows = id
    ? ws.sqlite
        .query(
          `${WORN_FILES}
           SELECT DISTINCT key FROM worn
           WHERE deleted_at = (SELECT deleted_at FROM sheets WHERE id = ?)
             AND key NOT IN (
               SELECT key FROM worn
               WHERE deleted_at IS NULL OR deleted_at != (SELECT deleted_at FROM sheets WHERE id = ?)
             )
             AND key NOT IN (SELECT key FROM kept)`,
        )
        .all(id, id)
    : ws.sqlite
        .query(
          `${WORN_FILES}
           SELECT DISTINCT key FROM worn
           WHERE deleted_at IS NOT NULL
             AND key NOT IN (SELECT key FROM worn WHERE deleted_at IS NULL)
             AND key NOT IN (SELECT key FROM kept)`,
        )
        .all()
  return (rows as { key: string }[]).map((row) => row.key.slice('file:'.length))
}
