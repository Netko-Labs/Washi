import type { UserTable } from '@washi/domain'
import { recordTable, userTableTable } from '@washi/domain/db'
import { type RecordData, type TableSpec, tableSpecSchema } from '@washi/ink'
import { and, eq, inArray, isNull } from 'drizzle-orm'
import { appendChange } from './changes'
import { newId, type Workspace } from './client'
import { appendOp } from './oplog'
import { tellRecordWrite } from './record-writes'

function toUserTable(row: typeof userTableTable.$inferSelect): UserTable {
  return {
    id: row.id,
    name: row.name,
    spec: tableSpecSchema.parse(row.spec),
    hlcUpdated: row.hlcUpdated,
  }
}

export function listTables(ws: Workspace): UserTable[] {
  return ws.db
    .select()
    .from(userTableTable)
    .where(isNull(userTableTable.deletedAt))
    .all()
    .map(toUserTable)
}

export function getTableByName(ws: Workspace, name: string): UserTable | null {
  const [row] = ws.db
    .select()
    .from(userTableTable)
    .where(and(eq(userTableTable.name, name), isNull(userTableTable.deletedAt)))
    .all()
  return row ? toUserTable(row) : null
}

export function defineTable(ws: Workspace, spec: TableSpec): UserTable {
  const existing = getTableByName(ws, spec.name)
  const now = ws.now()
  if (existing) {
    ws.db
      .update(userTableTable)
      .set({ spec, hlcUpdated: now })
      .where(eq(userTableTable.id, existing.id))
      .run()
    appendOp(ws, 'table', existing.id, { kind: 'define', spec })
    return { ...existing, spec, hlcUpdated: now }
  }
  const id = newId()
  ws.db
    .insert(userTableTable)
    .values({ id, name: spec.name, spec, hlcCreated: now, hlcUpdated: now })
    .run()
  appendOp(ws, 'table', id, { kind: 'define', spec })
  return { id, name: spec.name, spec, hlcUpdated: now }
}

export function insertRecord(
  ws: Workspace,
  tableId: string,
  data: RecordData,
  author: string | null = null,
): string {
  const now = ws.now()
  const id = newId()
  ws.db.insert(recordTable).values({ id, tableId, data, hlcCreated: now, hlcUpdated: now }).run()
  appendOp(ws, 'record', id, { kind: 'insert', tableId, data })
  appendChange(ws, tableId, id, data, author)
  tellRecordWrite(ws, { kind: 'insert', tableId, recordId: id, data, before: null, author })
  return id
}

export function findRecordTableId(ws: Workspace, recordId: string): string | null {
  const [row] = ws.db
    .select({ tableId: recordTable.tableId })
    .from(recordTable)
    .where(and(eq(recordTable.id, recordId), isNull(recordTable.deletedAt)))
    .all()
  return row?.tableId ?? null
}

export function updateRecords(
  ws: Workspace,
  tableId: string,
  ids: string[],
  patch: RecordData,
  author: string | null = null,
): number {
  if (ids.length === 0) return 0
  const rows = ws.db
    .select()
    .from(recordTable)
    .where(and(eq(recordTable.tableId, tableId), inArray(recordTable.id, ids)))
    .all()
  const now = ws.now()
  for (const row of rows) {
    const merged = { ...(row.data as RecordData), ...patch }
    ws.db
      .update(recordTable)
      .set({ data: merged, hlcUpdated: now })
      .where(eq(recordTable.id, row.id))
      .run()
    appendOp(ws, 'record', row.id, { kind: 'update', tableId, patch })
    appendChange(ws, tableId, row.id, merged, author)
    tellRecordWrite(ws, {
      kind: 'update',
      tableId,
      recordId: row.id,
      data: merged,
      before: row.data as RecordData,
      author,
    })
  }
  return rows.length
}

export function deleteRecords(
  ws: Workspace,
  tableId: string,
  ids: string[],
  author: string | null = null,
): number {
  if (ids.length === 0) return 0
  const placeholders = ids.map(() => '?').join(', ')
  const result = ws.sqlite
    .query(`UPDATE records SET deleted_at = ? WHERE table_id = ? AND id IN (${placeholders})`)
    .run(ws.now(), tableId, ...ids)
  for (const id of ids) {
    appendOp(ws, 'record', id, { kind: 'delete', tableId })
    appendChange(ws, tableId, id, null, author)
  }
  return result.changes
}

/**
 * Brings deleted records back as they were — the row behind a restored row page. Each return is
 * written to history like any write, so Activity shows it came back. Returns how many returned.
 */
export function restoreRecords(ws: Workspace, ids: string[], author: string | null = null): number {
  if (ids.length === 0) return 0
  const placeholders = ids.map(() => '?').join(', ')
  const deleted = ws.sqlite
    .query(
      `SELECT id, table_id, data FROM records WHERE deleted_at IS NOT NULL AND id IN (${placeholders})`,
    )
    .all(...ids) as { id: string; table_id: string; data: string }[]
  const restore = ws.sqlite.query('UPDATE records SET deleted_at = NULL WHERE id = ?')
  ws.sqlite.transaction(() => {
    for (const row of deleted) {
      restore.run(row.id)
      appendOp(ws, 'record', row.id, { kind: 'restore', tableId: row.table_id })
      appendChange(ws, row.table_id, row.id, JSON.parse(row.data) as RecordData, author)
    }
  })()
  return deleted.length
}

/**
 * A purged table's rows and their history, erased for good. Only `purgeTable` calls it: with the
 * table gone there is nothing left for history to describe.
 */
export function purgeRecords(ws: Workspace, tableId: string): void {
  ws.sqlite.query('DELETE FROM record_changes WHERE table_id = ?').run(tableId)
  ws.sqlite.query('DELETE FROM records WHERE table_id = ?').run(tableId)
}
