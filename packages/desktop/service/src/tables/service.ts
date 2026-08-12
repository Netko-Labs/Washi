import type { UserTable } from '@washi/desktop-domain'
import {
  defineTable,
  deleteRecords,
  executeQuery,
  getTableByName,
  insertRecord,
  matchRecordIds,
  updateRecords,
} from '@washi/desktop-repository'
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
  const referenced = [
    ...(query.where ?? []),
    ...(query.orderBy ? [query.orderBy] : []),
    ...(query.groupBy ? [query.groupBy] : []),
  ]
  const issues = unknownQueryColumns(table.spec, referenced)
  if (issues.length > 0) throw new InkError(issues.map((issue) => issue.message).join('; '))
  return executeQuery(table.id, table.spec, query)
}

export function runMutation(mutation: InkMutation): { affected: number; id?: string } {
  const table = requireTable(mutation.table)

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
export function toggleTaskRecord(tableName: string, recordId: string, done: boolean): void {
  const table = requireTable(tableName)
  updateRecords(table.id, [recordId], { done })
}
