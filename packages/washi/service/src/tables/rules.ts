import { ARRAY_COLUMN_TYPES, type Filter, type TableSpec } from '@washi/ink'
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
