import { ARRAY_COLUMN_TYPES, type Filter, type TableSpec } from '@washi/ink'
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
