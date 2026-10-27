import { ARRAY_COLUMN_TYPES, type Filter, type TableSpec } from '@washi/ink'
import { getTableByName, type Workspace } from '@washi/repository'
import { parseExpr, validateExpr } from '@washi/wsx'
import { InkError } from './errors'

const LIST_OPS: ReadonlySet<Filter['op']> = new Set(['eq', 'ne', 'contains', 'in'])

/** Lists answer membership only, and a row can sit in several groups, so none of them group. */
export function checkListUse(spec: TableSpec, filters: Filter[], groupColumn?: string): void {
  const lists = new Set(
    spec.columns.filter((column) => ARRAY_COLUMN_TYPES.has(column.type)).map((c) => c.name),
  )
  const misuse = filters.find((filter) => lists.has(filter.column) && !LIST_OPS.has(filter.op))
  if (misuse) throw new InkError(`"${misuse.op}" does not apply to the list "${misuse.column}"`)
  if (groupColumn && lists.has(groupColumn)) {
    throw new InkError(`cannot group by the list "${groupColumn}"`)
  }
}

/**
 * A formula reads its own row: every scalar column, and the formulas before it, are its
 * names. No aggregates — a sum over other rows is a rollup, not a formula. Refused at definition,
 * so a typo is a message now, never a column of nulls later.
 */
export function checkFormulas(spec: TableSpec): void {
  const readable = [
    'id',
    ...spec.columns
      .filter((column) => column.type !== 'formula' && !ARRAY_COLUMN_TYPES.has(column.type))
      .map((column) => column.name),
  ]
  for (const column of spec.columns) {
    if (column.type === 'formula' && column.expr) {
      let problems: string[]
      try {
        problems = validateExpr(parseExpr(column.expr), { state: readable, args: [], tables: {} })
      } catch (cause) {
        problems = [cause instanceof Error ? cause.message : String(cause)]
      }
      const errors = problems.filter((problem) => !problem.startsWith('warning:'))
      if (errors.length > 0) throw new InkError(`${column.name}: ${errors.join('; ')}`)
    }
    if (column.type === 'formula') readable.push(column.name)
  }
}

/**
 * A rollup must name a table, a `via` column on it that points here — a relation to this table,
 * or a plain value matched to this row's `on` — and something to aggregate that is stored or a
 * formula there: never another rollup, so no rollup ever waits on itself.
 */
export function checkRollups(ws: Workspace, spec: TableSpec): void {
  for (const column of spec.columns) {
    const rollup = column.rollup
    if (column.type !== 'rollup' || !rollup) continue
    const fail = (message: string) => {
      throw new InkError(`${column.name}: ${message}`)
    }
    const target = rollup.table === spec.name ? spec : getTableByName(ws, rollup.table)?.spec
    if (!target) fail(`no table "${rollup.table}" to roll up`)
    const columns = new Map((target?.columns ?? []).map((each) => [each.name, each]))
    const via = columns.get(rollup.via)
    if (!via) fail(`"${rollup.table}" has no column "${rollup.via}"`)
    if (via?.type === 'relation' && via.table !== spec.name) {
      fail(`"${rollup.via}" points at "${via.table}", not "${spec.name}"`)
    }
    // Rollups run before formulas, so `on` must be stored: a computed one is still empty here.
    if (via && via.type !== 'relation' && rollup.on) {
      const on = spec.columns.find((each) => each.name === rollup.on)
      const isStoredScalar =
        on && !ARRAY_COLUMN_TYPES.has(on.type) && on.type !== 'formula' && on.type !== 'rollup'
      if (!isStoredScalar) fail(`"${rollup.on}" is not a stored column to match on`)
    }
    if (rollup.fn !== 'count') {
      const aggregated = rollup.column ? columns.get(rollup.column) : undefined
      if (!aggregated) fail(`${rollup.fn} needs a column of "${rollup.table}"`)
      if (aggregated?.type === 'rollup') fail(`"${aggregated.name}" is itself a rollup`)
    }
    for (const filter of rollup.where ?? []) {
      if (filter.column !== 'id' && !columns.has(filter.column)) {
        fail(`"${rollup.table}" has no column "${filter.column}" to filter on`)
      }
    }
  }
}
