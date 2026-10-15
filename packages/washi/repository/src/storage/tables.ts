import type { UserTable } from '@washi/domain'
import { recordTable, userTableTable } from '@washi/domain/db'
import { type RecordData, type TableSpec, tableSpecSchema } from '@washi/ink'
import { and, eq, inArray, isNull } from 'drizzle-orm'
import { appendChange } from './changes'
import { newId, type Workspace } from './client'
import { appendOp } from './oplog'

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

export function insertRecord(ws: Workspace, tableId: string, data: RecordData): string {
  const now = ws.now()
  const id = newId()
  ws.db.insert(recordTable).values({ id, tableId, data, hlcCreated: now, hlcUpdated: now }).run()
  appendOp(ws, 'record', id, { kind: 'insert', tableId, data })
  appendChange(ws, tableId, id, data)
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
    appendChange(ws, tableId, row.id, merged)
  }
  return rows.length
}

export function deleteRecords(ws: Workspace, tableId: string, ids: string[]): number {
  if (ids.length === 0) return 0
  const placeholders = ids.map(() => '?').join(', ')
  const result = ws.sqlite
    .query(`UPDATE records SET deleted_at = ? WHERE table_id = ? AND id IN (${placeholders})`)
    .run(ws.now(), tableId, ...ids)
  for (const id of ids) {
    appendOp(ws, 'record', id, { kind: 'delete', tableId })
    appendChange(ws, tableId, id, null)
  }
  return result.changes
}
