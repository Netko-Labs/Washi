import type { UserTable } from '@washi/domain'
import {
  type InkMutation,
  type InkQuery,
  type QueryResult,
  type RecordData,
  type TableSpec,
  tableSpecSchema,
  unknownQueryColumns,
  validateRecord,
} from '@washi/ink'
import {
  defineTable,
  deleteRecords,
  executeQuery,
  findRecordTableId,
  getTableByName,
  insertRecord,
  listTables,
  matchRecordIds,
  updateRecords,
  type Workspace,
} from '@washi/repository'
import { InkError } from './errors'
import { renameRowPages, trashRowPages } from './rows'
import { checkFormulas, checkListUse, checkRollups } from './rules'

export { InkError }

function requireTable(ws: Workspace, name: string): UserTable {
  const table = getTableByName(ws, name)
  if (!table) throw new InkError(`unknown table "${name}"`)
  return table
}

export function defineUserTable(ws: Workspace, input: unknown): UserTable {
  const spec: TableSpec = tableSpecSchema.parse(input)
  checkFormulas(spec)
  checkRollups(ws, spec)
  for (const column of spec.columns) {
    if (column.table && column.table !== spec.name && !getTableByName(ws, column.table)) {
      throw new InkError(`${column.name}: relation to unknown table "${column.table}"`)
    }
  }
  return defineTable(ws, spec)
}

/** A property added from a database's header: appended, then the whole spec re-validated. */
export function addColumn(ws: Workspace, tableName: string, column: unknown): UserTable {
  const table = requireTable(ws, tableName)
  const name = (column as { name?: unknown } | null)?.name
  if (table.spec.columns.some((existing) => existing.name === name)) {
    throw new InkError(`"${String(name)}" is already a property of "${tableName}"`)
  }
  return defineUserTable(ws, { ...table.spec, columns: [...table.spec.columns, column] })
}

/** Every id a relation cell names must be a live record of the table it points at. */
function checkRelations(ws: Workspace, spec: TableSpec, data: RecordData): void {
  for (const column of spec.columns) {
    const ids = data[column.name]
    if (column.type !== 'relation' || !Array.isArray(ids) || !column.table) continue
    const target = requireTable(ws, column.table)
    const stray = ids.find((id) => findRecordTableId(ws, id) !== target.id)
    if (stray) throw new InkError(`${column.name}: no record "${stray}" in "${column.table}"`)
  }
}

function checkData(ws: Workspace, spec: TableSpec, data: RecordData): void {
  const issues = validateRecord(spec, data)
  if (issues.length > 0) {
    throw new InkError(issues.map((issue) => `${issue.path}: ${issue.message}`).join('; '))
  }
  checkRelations(ws, spec, data)
}

export function runQuery(ws: Workspace, query: InkQuery): QueryResult {
  const table = requireTable(ws, query.table)
  // Every slot that names a column, aggregates included — a descriptor column
  // that reaches the executor unchecked is a SQL surface (spec §09 P0).
  const referenced = [
    ...(query.where ?? []),
    ...(query.orderBy ? [query.orderBy] : []),
    ...(query.groupBy ? [query.groupBy] : []),
    ...(query.groupBy?.aggregates ?? []).flatMap((aggregate) =>
      aggregate.column ? [{ column: aggregate.column }] : [],
    ),
  ]
  const issues = unknownQueryColumns(table.spec, referenced)
  if (issues.length > 0) throw new InkError(issues.map((issue) => issue.message).join('; '))
  checkListUse(table.spec, query.where ?? [], query.groupBy?.column)
  return executeQuery(ws, table.id, table.spec, query)
}

export function runMutation(
  ws: Workspace,
  mutation: InkMutation,
): { affected: number; id?: string } {
  const table = requireTable(ws, mutation.table)

  if (mutation.kind !== 'insert') {
    const issues = unknownQueryColumns(table.spec, mutation.where)
    if (issues.length > 0) throw new InkError(issues.map((issue) => issue.message).join('; '))
    checkListUse(table.spec, mutation.where)
  }

  if (mutation.kind === 'insert' || mutation.kind === 'update') {
    checkData(ws, table.spec, mutation.data)
  }

  switch (mutation.kind) {
    case 'insert':
      return { affected: 1, id: insertRecord(ws, table.id, mutation.data) }
    case 'update': {
      const ids = matchRecordIds(ws, table.id, table.spec, mutation.where)
      const affected = updateRecords(ws, table.id, ids, mutation.data)
      renameRowPages(ws, table.spec, mutation.data, ids)
      return { affected }
    }
    case 'delete': {
      const ids = matchRecordIds(ws, table.id, table.spec, mutation.where)
      const affected = deleteRecords(ws, table.id, ids)
      trashRowPages(ws, ids)
      return { affected }
    }
  }
}

/** Patch one record by id — the `table.update` verb. Columns must exist and typecheck. */
export function updateRecord(
  ws: Workspace,
  tableName: string,
  recordId: string,
  patch: RecordData,
): void {
  const table = requireTable(ws, tableName)
  checkData(ws, table.spec, patch)
  if (updateRecords(ws, table.id, [recordId], patch) === 0) {
    throw new InkError(`unknown record "${recordId}" on table "${tableName}"`)
  }
  renameRowPages(ws, table.spec, patch, [recordId])
}

/** Soft-delete one record by id — the `table.delete` verb. The row keeps its history. */
export function deleteRecord(ws: Workspace, tableName: string, recordId: string): void {
  const table = requireTable(ws, tableName)
  if (deleteRecords(ws, table.id, [recordId]) === 0) {
    throw new InkError(`unknown record "${recordId}" on table "${tableName}"`)
  }
  trashRowPages(ws, [recordId])
}

/** Task checkbox write-back: flip `done` on one record by id. */
/**
 * A `<Task>` ticks one checkbox column on its row. Named, it must be a checkbox column — a typo
 * would otherwise write a key nothing reads, and the box would look saved and not be. Unnamed, it
 * is `done`, as it always was, even on a table that never declared one.
 */
export function toggleTaskRecord(
  ws: Workspace,
  recordId: string,
  done: boolean,
  field?: string,
): void {
  const tableId = findRecordTableId(ws, recordId)
  if (!tableId) throw new InkError(`unknown record "${recordId}"`)
  if (field !== undefined) {
    const table = listTables(ws).find((each) => each.id === tableId)
    const column = table?.spec.columns.find((each) => each.name === field)
    if (column?.type !== 'boolean') {
      throw new InkError(`"${field}" is not a checkbox column on ${table?.name ?? 'this table'}`)
    }
  }
  updateRecords(ws, tableId, [recordId], { [field ?? 'done']: done })
}
