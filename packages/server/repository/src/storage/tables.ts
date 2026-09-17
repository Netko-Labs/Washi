import type { UserTable } from '@washi/domain'
import { recordTable, userTableTable } from '@washi/domain/db'
import { type RecordData, type TableSpec, tableSpecSchema } from '@washi/ink'
import { and, eq, inArray, isNull } from 'drizzle-orm'
import { getDb, getSqlite, hlcNow, newId } from './client'
import { appendOp } from './oplog'

function toUserTable(row: typeof userTableTable.$inferSelect): UserTable {
  return {
    id: row.id,
    name: row.name,
    spec: tableSpecSchema.parse(row.spec),
    hlcUpdated: row.hlcUpdated,
  }
}

export function listTables(): UserTable[] {
  return getDb()
    .select()
    .from(userTableTable)
    .where(isNull(userTableTable.deletedAt))
    .all()
    .map(toUserTable)
}

export function getTableByName(name: string): UserTable | null {
  const [row] = getDb()
    .select()
    .from(userTableTable)
    .where(and(eq(userTableTable.name, name), isNull(userTableTable.deletedAt)))
    .all()
  return row ? toUserTable(row) : null
}

export function defineTable(spec: TableSpec): UserTable {
  const existing = getTableByName(spec.name)
  const now = hlcNow()
  if (existing) {
    getDb()
      .update(userTableTable)
      .set({ spec, hlcUpdated: now })
      .where(eq(userTableTable.id, existing.id))
      .run()
    appendOp('table', existing.id, { kind: 'define', spec })
    return { ...existing, spec, hlcUpdated: now }
  }
  const id = newId()
  getDb()
    .insert(userTableTable)
    .values({ id, name: spec.name, spec, hlcCreated: now, hlcUpdated: now })
    .run()
  appendOp('table', id, { kind: 'define', spec })
  return { id, name: spec.name, spec, hlcUpdated: now }
}

export function insertRecord(tableId: string, data: RecordData): string {
  const now = hlcNow()
  const id = newId()
  getDb().insert(recordTable).values({ id, tableId, data, hlcCreated: now, hlcUpdated: now }).run()
  appendOp('record', id, { kind: 'insert', tableId, data })
  return id
}

export function findRecordTableId(recordId: string): string | null {
  const [row] = getDb()
    .select({ tableId: recordTable.tableId })
    .from(recordTable)
    .where(and(eq(recordTable.id, recordId), isNull(recordTable.deletedAt)))
    .all()
  return row?.tableId ?? null
}

export function updateRecords(tableId: string, ids: string[], patch: RecordData): number {
  if (ids.length === 0) return 0
  const db = getDb()
  const rows = db
    .select()
    .from(recordTable)
    .where(and(eq(recordTable.tableId, tableId), inArray(recordTable.id, ids)))
    .all()
  const now = hlcNow()
  for (const row of rows) {
    const merged = { ...(row.data as RecordData), ...patch }
    db.update(recordTable)
      .set({ data: merged, hlcUpdated: now })
      .where(eq(recordTable.id, row.id))
      .run()
    appendOp('record', row.id, { kind: 'update', tableId, patch })
  }
  return rows.length
}

export function deleteRecords(tableId: string, ids: string[]): number {
  if (ids.length === 0) return 0
  const placeholders = ids.map(() => '?').join(', ')
  const result = getSqlite()
    .query(`UPDATE records SET deleted_at = ? WHERE table_id = ? AND id IN (${placeholders})`)
    .run(hlcNow(), tableId, ...ids)
  for (const id of ids) appendOp('record', id, { kind: 'delete', tableId })
  return result.changes
}
