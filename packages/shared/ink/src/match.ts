import type { Cell, Filter, QueryRow, Scalar, TableSpec } from './types'
import { ARRAY_COLUMN_TYPES } from './validate'

type Value = Scalar | Scalar[]

const isEmpty = (cell: Scalar): boolean => cell === null || cell === ''

function compare(cell: Scalar, op: Filter['op'], value: Value): boolean {
  if (op === 'in') return (Array.isArray(value) ? value : [value]).includes(cell)
  const target = Array.isArray(value) ? String(value) : value
  if (isEmpty(target) && op === 'eq') return isEmpty(cell)
  if (isEmpty(target) && op === 'ne') return !isEmpty(cell)
  // Notion's "is not" keeps an empty cell.
  if (op === 'ne') return cell === null || cell !== target
  // SQL: a comparison against NULL is never true.
  if (cell === null || target === null) return false
  switch (op) {
    case 'eq':
      return cell === target
    case 'gt':
      return cell > target
    case 'gte':
      return cell >= target
    case 'lt':
      return cell < target
    case 'lte':
      return cell <= target
    case 'contains':
      // SQLite's LIKE folds ASCII case only; close enough for a filter that already did.
      return String(cell).toLowerCase().includes(String(target).toLowerCase())
  }
}

function holds(cell: Cell, value: Value): boolean {
  const items = Array.isArray(cell) ? cell : []
  return (Array.isArray(value) ? value : [value]).some((each) => items.includes(String(each)))
}

function listMatches(cell: Cell, filter: Filter): boolean {
  if (!Array.isArray(filter.value) && isEmpty(filter.value) && ['eq', 'ne'].includes(filter.op)) {
    const isFilled = Array.isArray(cell) && cell.length > 0
    return filter.op === 'eq' ? !isFilled : isFilled
  }
  return filter.op === 'ne' ? !holds(cell, filter.value) : holds(cell, filter.value)
}

/** The executor's filter semantics over a row in memory — what history replays day by day. */
export function matchesFilters(row: QueryRow, filters: Filter[], spec: TableSpec): boolean {
  const lists = new Set(
    spec.columns.filter((column) => ARRAY_COLUMN_TYPES.has(column.type)).map((c) => c.name),
  )
  return filters.every((filter) => {
    const cell = row[filter.column] ?? null
    if (lists.has(filter.column)) return listMatches(cell, filter)
    return compare(Array.isArray(cell) ? null : cell, filter.op, filter.value)
  })
}
