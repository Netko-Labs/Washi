import {
  ARRAY_COLUMN_TYPES,
  type Filter,
  type InkQuery,
  type QueryResult,
  type Scalar,
  type TableSpec,
} from '@washi/ink'

import type { Workspace } from './client'

const FILTER_SQL: Record<Filter['op'], string> = {
  eq: '= ?',
  ne: '!= ?',
  gt: '> ?',
  gte: '>= ?',
  lt: '< ?',
  lte: '<= ?',
  contains: "LIKE '%' || ? || '%'",
  in: 'IN', // expanded per-value below
}

const IDENTIFIER = /^[a-z][a-z0-9_]*$/

/**
 * SAFETY: the ink executor is the only place descriptors become SQL. Column
 * names arrive from agent- and sheet-authored descriptors, so they are bound as
 * json paths rather than interpolated, and the shape is asserted regardless —
 * the service's membership check against the table spec is the first gate, this
 * is the one that holds when a future caller forgets it (spec §09 P0).
 */
function assertIdentifier(column: string): string {
  if (!IDENTIFIER.test(column)) throw new Error(`invalid column identifier "${column}"`)
  return column
}

/** Appends the bound json path and returns the expression referencing it. */
function columnExpr(column: string, params: Scalar[]): string {
  if (column === 'id') return 'id'
  params.push(`$.${assertIdentifier(column)}`)
  return 'json_extract(data, ?)'
}

function arrayColumns(spec: TableSpec): Set<string> {
  return new Set(
    spec.columns.filter((column) => ARRAY_COLUMN_TYPES.has(column.type)).map((c) => c.name),
  )
}

/** On a list column, eq/contains/in ask "holds any of these", and ne asks "holds none". */
function listClause(filter: Filter, params: Scalar[]): string {
  if (!['eq', 'ne', 'contains', 'in'].includes(filter.op)) {
    throw new Error(`"${filter.op}" does not apply to the list column "${filter.column}"`)
  }
  const values = Array.isArray(filter.value) ? filter.value : [filter.value]
  params.push(`$.${assertIdentifier(filter.column)}`, ...values)
  const holds = `EXISTS (SELECT 1 FROM json_each(data, ?) WHERE value IN (${values.map(() => '?').join(', ')}))`
  return filter.op === 'ne' ? `NOT ${holds}` : holds
}

function buildWhere(filters: Filter[], spec: TableSpec): { sql: string; params: Scalar[] } {
  const clauses: string[] = []
  const params: Scalar[] = []
  const lists = arrayColumns(spec)
  for (const filter of filters) {
    if (lists.has(filter.column)) {
      clauses.push(listClause(filter, params))
      continue
    }
    const expr = columnExpr(filter.column, params)
    if (filter.op === 'in') {
      const values = Array.isArray(filter.value) ? filter.value : [filter.value]
      clauses.push(`${expr} IN (${values.map(() => '?').join(', ')})`)
      params.push(...values)
    } else {
      clauses.push(`${expr} ${FILTER_SQL[filter.op]}`)
      params.push(Array.isArray(filter.value) ? String(filter.value) : filter.value)
    }
  }
  return { sql: clauses.length ? ` AND ${clauses.join(' AND ')}` : '', params }
}

function groupQuery(
  ws: Workspace,
  tableId: string,
  spec: TableSpec,
  query: InkQuery & { groupBy: NonNullable<InkQuery['groupBy']> },
  limit: number,
): QueryResult {
  // Params accumulate in SQL text order: projection, table id, filters, limit.
  const selectParams: Scalar[] = []
  const groupColumn = assertIdentifier(query.groupBy.column)
  if (arrayColumns(spec).has(groupColumn)) {
    throw new Error(`cannot group by the list column "${groupColumn}"`)
  }
  const groupExpr = columnExpr(groupColumn, selectParams)

  const aggregates = query.groupBy.aggregates
    .map((aggregate) => {
      if (aggregate.fn === 'count') return `COUNT(*) AS "${aggregate.fn}"`
      if (!aggregate.column) throw new Error(`aggregate "${aggregate.fn}" needs a column`)
      const column = assertIdentifier(aggregate.column)
      return `${aggregate.fn.toUpperCase()}(${columnExpr(column, selectParams)}) AS "${aggregate.fn}_${column}"`
    })
    .join(', ')

  const where = buildWhere(query.where ?? [], spec)
  // GROUP BY 1 targets the first result column, so the expression is not repeated.
  const sql = `
    SELECT ${groupExpr} AS "${groupColumn}", ${aggregates}
    FROM records WHERE table_id = ? AND deleted_at IS NULL${where.sql}
    GROUP BY 1 LIMIT ?`
  const rows = ws.sqlite
    .query(sql)
    .all(...selectParams, tableId, ...where.params, limit) as QueryResult['rows']
  return { rows, total: rows.length }
}

/** Run an ink query over a table's JSON records. Descriptor → parametrized SQL. */
export function executeQuery(
  ws: Workspace,
  tableId: string,
  spec: TableSpec,
  query: InkQuery,
): QueryResult {
  const limit = query.limit ?? 200
  if (query.groupBy) {
    return groupQuery(ws, tableId, spec, { ...query, groupBy: query.groupBy }, limit)
  }

  const selectParams: Scalar[] = []
  const projection = spec.columns
    .map((column) => {
      const name = assertIdentifier(column.name)
      return `${columnExpr(name, selectParams)} AS "${name}"`
    })
    .join(', ')

  const where = buildWhere(query.where ?? [], spec)
  // Ordering targets the projected alias, so the json path is bound once.
  const orderSql = query.orderBy
    ? ` ORDER BY "${assertIdentifier(query.orderBy.column)}" ${query.orderBy.direction === 'desc' ? 'DESC' : 'ASC'}`
    : ' ORDER BY hlc_created ASC'
  const sql = `
    SELECT id, ${projection}
    FROM records WHERE table_id = ? AND deleted_at IS NULL${where.sql}${orderSql} LIMIT ?`
  const rows = ws.sqlite
    .query(sql)
    .all(...selectParams, tableId, ...where.params, limit) as QueryResult['rows']

  // json_extract hands back booleans as 0/1 and arrays as JSON text — restore both.
  const lists = arrayColumns(spec)
  for (const row of rows) {
    for (const column of spec.columns) {
      const value = row[column.name]
      if (column.type === 'boolean' && typeof value === 'number') row[column.name] = value === 1
      if (lists.has(column.name) && typeof value === 'string') row[column.name] = JSON.parse(value)
    }
  }
  return { rows, total: rows.length }
}

/** Ids matched by a filter set, for update/delete mutations. */
export function matchRecordIds(
  ws: Workspace,
  tableId: string,
  spec: TableSpec,
  filters: Filter[],
): string[] {
  const where = buildWhere(filters, spec)
  return ws.sqlite
    .query(`SELECT id FROM records WHERE table_id = ? AND deleted_at IS NULL${where.sql}`)
    .all(tableId, ...where.params)
    .map((row) => (row as { id: string }).id)
}
