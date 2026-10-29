import { statusOptions } from '@washi/ink'
import type {
  Choice,
  ColumnSpec,
  DatabaseView,
  Person,
  PropertyDraft,
  StatusGroup,
  TableSpec,
} from './types'

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

export function statusGroupOf(column: ColumnSpec, value: string): StatusGroup | undefined {
  if (!value || !column.groups) return undefined
  if (column.groups.done.includes(value)) return 'done'
  if (column.groups.doing.includes(value)) return 'doing'
  return 'todo'
}

/** One of the chart ramp's five hues, by the option's place in its column. */
export function hueAt(index: number): number {
  return (Math.max(0, index) % 5) + 1
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/** `2026-11-04` reads "Nov 4, 2026"; a range "Nov 4 – 6, 2026", the locale's own way. */
export function dateLabel(start: string, end: string, locale?: string): string {
  const format = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const from = new Date(`${start.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(from.getTime())) return start
  const to = end ? new Date(`${end.slice(0, 10)}T00:00:00`) : null
  return to && !Number.isNaN(to.getTime()) && to > from
    ? format.formatRange(from, to)
    : format.format(from)
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

export const needsOptions = (type: ColumnSpec['type']) =>
  type === 'select' || type === 'multi_select'

/** Why a new property can't be added yet, in words; null once it can. */
export function propertyProblem(draft: PropertyDraft, taken: string[]): string | null {
  if (!draft.label.trim()) return 'Name the property first.'
  if (taken.includes(columnKey(draft.label)))
    return `“${draft.label.trim()}” is already a property.`
  if (needsOptions(draft.type) && draft.options.length === 0) return 'Add at least one option.'
  return null
}
