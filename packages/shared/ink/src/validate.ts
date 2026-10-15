import type { Cell, ColumnSpec, ColumnType, RecordData, TableSpec } from './types'

export interface InkIssue {
  path: string
  message: string
}

export const ARRAY_COLUMN_TYPES: ReadonlySet<ColumnType> = new Set(['multi_select', 'relation'])

export function statusOptions(column: ColumnSpec): string[] {
  const groups = column.groups
  return groups ? [...groups.todo, ...groups.doing, ...groups.done] : []
}

const isDate = (value: string) => !Number.isNaN(Date.parse(value))

/** A date, or Notion's date with an end: `start/end`, ISO 8601's interval form. */
function checkDate(value: string): string | null {
  const [start, end, ...rest] = value.split('/')
  if (rest.length > 0 || !start || !isDate(start) || (end !== undefined && !isDate(end))) {
    return 'expected an ISO date, or start/end'
  }
  return end !== undefined && Date.parse(end) < Date.parse(start)
    ? 'the end is before the start'
    : null
}

function checkOneOf(options: string[], value: string): string | null {
  return options.includes(value) ? null : `expected one of: ${options.join(', ')}`
}

function checkUrl(value: string): string | null {
  if (!URL.canParse(value)) return 'expected a URL'
  return /^https?:$/.test(new URL(value).protocol) ? null : 'expected an http(s) URL'
}

function checkList(column: ColumnSpec, value: string[]): string | null {
  if (new Set(value).size !== value.length) return 'expected no repeats'
  if (column.type === 'relation') return null
  const unknown = value.find((entry) => !(column.options ?? []).includes(entry))
  return unknown === undefined ? null : checkOneOf(column.options ?? [], unknown)
}

function checkValue(column: ColumnSpec, value: Cell): string | null {
  if (value === null) return null
  if (ARRAY_COLUMN_TYPES.has(column.type)) {
    return Array.isArray(value) ? checkList(column, value) : 'expected a list of strings'
  }
  if (Array.isArray(value)) return 'expected a single value, not a list'
  switch (column.type) {
    case 'number':
      return typeof value === 'number' && Number.isFinite(value) ? null : 'expected a number'
    case 'boolean':
      return typeof value === 'boolean' ? null : 'expected a boolean'
    default:
      break
  }
  if (typeof value !== 'string') return 'expected a string'
  switch (column.type) {
    case 'date':
      return checkDate(value)
    case 'select':
      return checkOneOf(column.options ?? [], value)
    case 'status':
      return checkOneOf(statusOptions(column), value)
    case 'url':
      return checkUrl(value)
    default:
      return null
  }
}

/** Validate record data against a table's column specs. Unknown columns are errors. */
export function validateRecord(spec: TableSpec, data: RecordData): InkIssue[] {
  const issues: InkIssue[] = []
  const columns = new Map(spec.columns.map((column) => [column.name, column]))

  for (const [key, value] of Object.entries(data)) {
    const column = columns.get(key)
    if (!column) {
      issues.push({ path: key, message: `unknown column "${key}" on table "${spec.name}"` })
      continue
    }
    const problem = checkValue(column, value)
    if (problem) issues.push({ path: key, message: problem })
  }

  return issues
}

/** Columns referenced by a query that don't exist on the table. */
export function unknownQueryColumns(spec: TableSpec, referenced: { column: string }[]): InkIssue[] {
  const known = new Set(['id', ...spec.columns.map((column) => column.name)])
  return referenced
    .filter(({ column }) => !known.has(column))
    .map(({ column }) => ({
      path: column,
      message: `unknown column "${column}" on table "${spec.name}"`,
    }))
}
