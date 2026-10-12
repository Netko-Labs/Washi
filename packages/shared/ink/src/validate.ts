import type { ColumnSpec, RecordData, Scalar, TableSpec } from './types'

export interface InkIssue {
  path: string
  message: string
}

function checkValue(column: ColumnSpec, value: Scalar): string | null {
  if (value === null) return null
  switch (column.type) {
    case 'text':
      return typeof value === 'string' ? null : 'expected a string'
    case 'number':
      return typeof value === 'number' && Number.isFinite(value) ? null : 'expected a number'
    case 'boolean':
      return typeof value === 'boolean' ? null : 'expected a boolean'
    case 'date':
      return typeof value === 'string' && !Number.isNaN(Date.parse(value))
        ? null
        : 'expected an ISO date string'
    case 'select':
      if (typeof value !== 'string') return 'expected a string'
      return (column.options ?? []).includes(value)
        ? null
        : `expected one of: ${(column.options ?? []).join(', ')}`
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
