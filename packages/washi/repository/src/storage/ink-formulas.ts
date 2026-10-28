import {
  type Aggregate,
  type Filter,
  type InkQuery,
  matchesFilters,
  type QueryResult,
  type QueryRow,
  type Scalar,
  type TableSpec,
} from '@washi/ink'
import { type ExprAst, evaluateExpr, parseExpr } from '@washi/wsx'
import type { FormulaCall } from './formula-functions'

/** How many rows a query that filters, sorts or groups on a formula may read before computing. */
export const MEMORY_ROW_CAP = 5000

const parsed = new Map<string, ExprAst | null>()

function astOf(expr: string): ExprAst | null {
  if (!parsed.has(expr)) {
    try {
      parsed.set(expr, parseExpr(expr, undefined, { workspaceCalls: true }))
    } catch {
      parsed.set(expr, null)
    }
  }
  return parsed.get(expr) ?? null
}

const isComputed = (type: string) => type === 'formula' || type === 'rollup'

/** Formula and rollup columns: worked out on read, absent from the stored JSON. */
export function formulaNames(spec: TableSpec): Set<string> {
  return new Set(spec.columns.filter((column) => isComputed(column.type)).map((c) => c.name))
}

/** The table as SQL sees it: computed columns are not in the stored JSON. */
export function storedSpec(spec: TableSpec): TableSpec {
  return { ...spec, columns: spec.columns.filter((column) => !isComputed(column.type)) }
}

/** Whether filtering, ordering or grouping needs a computed value, so SQL alone cannot answer. */
export function needsMemory(
  spec: TableSpec,
  query: Pick<InkQuery, 'where' | 'orderBy' | 'groupBy'>,
) {
  const formulas = formulaNames(spec)
  if (formulas.size === 0) return false
  const named = [
    ...(query.where ?? []).map((filter) => filter.column),
    query.orderBy?.column,
    query.groupBy?.column,
    ...(query.groupBy?.aggregates ?? []).map((aggregate) => aggregate.column),
  ]
  return named.some((name) => name !== undefined && formulas.has(name))
}

/**
 * Each formula over its own row: the row's scalar cells are the names it reads (lists are not
 * scalars, so they read as absent). A formula that fails — a bad cell, a division by zero — is
 * null for that row, never an error for the whole query.
 */
export function computeFormulas(
  spec: TableSpec,
  rows: QueryRow[],
  now = Date.now(),
  call?: FormulaCall,
): void {
  const formulas = spec.columns.filter((column) => column.type === 'formula')
  if (formulas.length === 0) return
  for (const row of rows) {
    const cells: Record<string, Scalar> = {}
    for (const [name, value] of Object.entries(row)) {
      if (!Array.isArray(value)) cells[name] = value
    }
    for (const column of formulas) {
      const ast = column.expr ? astOf(column.expr) : null
      let value: Scalar = null
      if (ast) {
        try {
          const result = evaluateExpr(ast, {
            state: cells,
            args: {},
            rows: () => undefined,
            now,
            call,
          })
          value = Array.isArray(result) ? null : (result as Scalar)
        } catch {
          value = null
        }
      }
      row[column.name] = value
      cells[column.name] = value
    }
  }
}

function compareCells(a: unknown, b: unknown): number {
  if (a === b) return 0
  if (a === null || a === undefined) return -1
  if (b === null || b === undefined) return 1
  return (a as number | string) < (b as number | string) ? -1 : 1
}

function aggregate(rows: QueryRow[], { fn, column }: Aggregate): Scalar {
  if (fn === 'count') return rows.length
  const values = rows
    .map((row) => row[column ?? ''])
    .filter((value): value is number => typeof value === 'number')
  if (values.length === 0) return null
  if (fn === 'sum') return values.reduce((total, value) => total + value, 0)
  if (fn === 'avg') return values.reduce((total, value) => total + value, 0) / values.length
  return fn === 'min' ? Math.min(...values) : Math.max(...values)
}

/**
 * The rest of a query, in memory, once formulas are computed: the formula filters SQL could not
 * run, then order, group and limit — named and shaped exactly as the SQL path answers.
 */
export function finishInMemory(
  spec: TableSpec,
  rows: QueryRow[],
  query: InkQuery,
  formulaFilters: Filter[],
  limit: number,
): QueryResult {
  const kept = rows.filter((row) => matchesFilters(row, formulaFilters, spec))
  if (query.groupBy) {
    const { column, aggregates } = query.groupBy
    const groups = new Map<string, QueryRow[]>()
    for (const row of kept) {
      const key = JSON.stringify(row[column] ?? null)
      groups.set(key, [...(groups.get(key) ?? []), row])
    }
    const out = [...groups].slice(0, limit).map(([key, members]) => {
      const result: QueryRow = { [column]: JSON.parse(key) }
      for (const each of aggregates) {
        result[each.fn === 'count' ? 'count' : `${each.fn}_${each.column}`] = aggregate(
          members,
          each,
        )
      }
      return result
    })
    return { rows: out, total: out.length }
  }
  if (query.orderBy) {
    const { column, direction } = query.orderBy
    const sign = direction === 'desc' ? -1 : 1
    kept.sort((a, b) => sign * compareCells(a[column], b[column]))
  }
  const out = kept.slice(0, limit)
  return { rows: out, total: out.length }
}
