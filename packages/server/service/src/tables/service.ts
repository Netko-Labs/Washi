import type { UserTable } from '@washi/domain'
import {
  defineTable,
  deleteRecords,
  executeQuery,
  findRecordTableId,
  getTableByName,
  insertRecord,
  matchRecordIds,
  updateRecords,
} from '@washi/repository'
import {
  type InkMutation,
  type InkQuery,
  type QueryResult,
  type TableSpec,
  tableSpecSchema,
  unknownQueryColumns,
  validateRecord,
} from '@washi/ink'

export class InkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InkError'
  }
}

function requireTable(name: string): UserTable {
  const table = getTableByName(name)
  if (!table) throw new InkError(`unknown table "${name}"`)
  return table
}

export function defineUserTable(input: unknown): UserTable {
  const spec: TableSpec = tableSpecSchema.parse(input)
  return defineTable(spec)
}

export function runQuery(query: InkQuery): QueryResult {
  const table = requireTable(query.table)
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
  return executeQuery(table.id, table.spec, query)
}

export function runMutation(mutation: InkMutation): { affected: number; id?: string } {
  const table = requireTable(mutation.table)

  if (mutation.kind !== 'insert') {
    const issues = unknownQueryColumns(table.spec, mutation.where)
    if (issues.length > 0) throw new InkError(issues.map((issue) => issue.message).join('; '))
  }

  if (mutation.kind === 'insert' || mutation.kind === 'update') {
    const issues = validateRecord(table.spec, mutation.data)
    if (issues.length > 0) {
      throw new InkError(issues.map((issue) => `${issue.path}: ${issue.message}`).join('; '))
    }
  }

  switch (mutation.kind) {
    case 'insert':
      return { affected: 1, id: insertRecord(table.id, mutation.data) }
    case 'update': {
      const ids = matchRecordIds(table.id, mutation.where)
      return { affected: updateRecords(table.id, ids, mutation.data) }
    }
    case 'delete': {
      const ids = matchRecordIds(table.id, mutation.where)
      return { affected: deleteRecords(table.id, ids) }
    }
  }
}

/** Task checkbox write-back: flip `done` on one record by id. */
export function toggleTaskRecord(recordId: string, done: boolean): void {
  const tableId = findRecordTableId(recordId)
  if (!tableId) throw new InkError(`unknown record "${recordId}"`)
  updateRecords(tableId, [recordId], { done })
}
