import type { Filter, InkQuery, QueryResult, Scalar, TableSpec } from '@washi/ink'

import { getSqlite } from './client'

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

function columnExpr(column: string): string {
  // Column names are validated against the table spec before we get here;
  // the spec regex ([a-z][a-z0-9_]*) makes interpolation into '$.…' safe.
  return `json_extract(data, '$.${column}')`
}

function buildWhere(filters: Filter[]): { sql: string; params: Scalar[] } {
  const clauses: string[] = []
  const params: Scalar[] = []
  for (const filter of filters) {
    const expr = columnExpr(filter.column)
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

/** Run an ink query over a table's JSON records. Descriptor → parametrized SQL. */
export function executeQuery(tableId: string, spec: TableSpec, query: InkQuery): QueryResult {
  const where = buildWhere(query.where ?? [])
  const limit = query.limit ?? 200

  if (query.groupBy) {
    const aggregates = query.groupBy.aggregates
      .map((aggregate, index) => {
        const alias = aggregate.column ? `${aggregate.fn}_${aggregate.column}` : aggregate.fn
        return aggregate.fn === 'count'
          ? `COUNT(*) AS "${alias}"`
          : `${aggregate.fn.toUpperCase()}(${columnExpr(aggregate.column ?? `agg${index}`)}) AS "${alias}"`
      })
      .join(', ')
    const sql = `
      SELECT ${columnExpr(query.groupBy.column)} AS "${query.groupBy.column}", ${aggregates}
      FROM records WHERE table_id = ? AND deleted_at IS NULL${where.sql}
      GROUP BY ${columnExpr(query.groupBy.column)} LIMIT ?`
    const rows = getSqlite()
      .query(sql)
      .all(tableId, ...where.params, limit) as QueryResult['rows']
    return { rows, total: rows.length }
  }

  const projection = spec.columns
    .map((column) => `${columnExpr(column.name)} AS "${column.name}"`)
    .join(', ')
  const orderSql = query.orderBy
    ? ` ORDER BY ${columnExpr(query.orderBy.column)} ${query.orderBy.direction === 'desc' ? 'DESC' : 'ASC'}`
    : ' ORDER BY hlc_created ASC'
  const sql = `
    SELECT id, ${projection}
    FROM records WHERE table_id = ? AND deleted_at IS NULL${where.sql}${orderSql} LIMIT ?`
  const rows = getSqlite()
    .query(sql)
    .all(tableId, ...where.params, limit) as QueryResult['rows']

  // sqlite stores booleans as 0/1 inside json_extract results — restore them.
  for (const row of rows) {
    for (const column of spec.columns) {
      if (column.type === 'boolean' && typeof row[column.name] === 'number') {
        row[column.name] = row[column.name] === 1
      }
    }
  }
  return { rows, total: rows.length }
}

/** Ids matched by a filter set, for update/delete mutations. */
export function matchRecordIds(tableId: string, filters: Filter[]): string[] {
  const where = buildWhere(filters)
  return getSqlite()
    .query(`SELECT id FROM records WHERE table_id = ? AND deleted_at IS NULL${where.sql}`)
    .all(tableId, ...where.params)
    .map((row) => (row as { id: string }).id)
}
