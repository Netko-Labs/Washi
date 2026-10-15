import { statusOptions } from '@washi/ink'
import type { Choice, ColumnSpec, DatabaseView, Person, TableSpec } from './types'

/** Notion's title property: the first text column names the row. */
export function titleColumn(spec: TableSpec): ColumnSpec | undefined {
  return spec.columns.find((column) => column.type === 'text')
}

/** A page that names no views gets a table, and a board when something can group it. */
export function defaultViews(spec: TableSpec): DatabaseView[] {
  const groupable =
    spec.columns.find((column) => column.type === 'status') ??
    spec.columns.find((column) => column.type === 'select')
  const dated = spec.columns.find((column) => column.type === 'date')
  return [
    { name: 'Table', kind: 'table' },
    ...(groupable ? [{ name: 'Board', kind: 'board' as const, groupBy: groupable.name }] : []),
    ...(dated ? [{ name: 'Timeline', kind: 'timeline' as const, date: dated.name }] : []),
  ]
}

export function choicesFor(column: ColumnSpec, people: Person[]): Choice[] {
  if (column.type === 'person') return people.map(({ id, name }) => ({ value: id, label: name }))
  const values = column.type === 'status' ? statusOptions(column) : (column.options ?? [])
  return values.map((value) => ({ value, label: value }))
}

/** A header label becomes a column name: "Due date" → `due_date`. */
export function columnKey(label: string): string {
  const key = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64)
  return /^[a-z]/.test(key) ? key : `p_${key}`.slice(0, 64)
}

export function labelOf(name: string): string {
  return name.replace(/_/g, ' ')
}

/** A new row is named "Untitled" and starts where Notion starts it: the first to-do status. */
export function newRow(spec: TableSpec): Record<string, string> {
  const title = titleColumn(spec)
  const status = spec.columns.find((column) => column.type === 'status')
  return {
    ...(title && { [title.name]: 'Untitled' }),
    ...(status?.groups?.todo[0] && { [status.name]: status.groups.todo[0] }),
  }
}

/** A board's order lives in a number column named `rank`; it orders cards, nobody reads it. */
export function isRank(column: ColumnSpec): boolean {
  return column.name === 'rank' && column.type === 'number'
}

/** "bug_triage" reads as "Bug triage". */
export function tableLabel(name: string): string {
  const words = labelOf(name)
  return words.charAt(0).toUpperCase() + words.slice(1)
}
