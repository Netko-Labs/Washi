import { type Cell, statusOptions } from '@washi/ink'
import type { KeyboardEvent } from 'react'
import type { PaperHost } from '../../../provider'
import type {
  Choice,
  ColumnSpec,
  DatabaseView,
  OptionGroup,
  OptionRemoval,
  Person,
  PropertyDraft,
  QueryRow,
  SortDirection,
  StatusGroup,
  TableSpec,
} from './types'
import {
  CHOICE_TYPES,
  DEFAULT_STATUS_GROUPS,
  OPTION_USE_LIMIT,
  RELATION_CHOICE_LIMIT,
  STATUS_GROUP_LABELS,
} from './values'

/** Notion's title property: the first text column names the row. */
export function titleColumn(spec: TableSpec): ColumnSpec | undefined {
  return spec.columns.find((column) => column.type === 'text')
}

/** A view's `columns` in the order the page wrote them; a name the table lacks is skipped. */
export function namedColumns(spec: TableSpec, names: string[]): ColumnSpec[] {
  return names.flatMap((name) => spec.columns.find((column) => column.name === name) ?? [])
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
  return fullYears(
    to && !Number.isNaN(to.getTime()) && to > from
      ? format.formatRangeToParts(from, to)
      : format.formatToParts(from),
  )
}

/** Intl writes year 1 as "1"; a date column means `0001`. */
function fullYears(parts: Intl.DateTimeFormatPart[]): string {
  return parts
    .map((part) => (part.type === 'year' ? part.value.padStart(4, '0') : part.value))
    .join('')
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
  if (needsOptions(draft.type) && draft.options.length > 64) return 'Keep it to 64 options.'
  return null
}

/** The column a new property becomes: options for a select, Notion's three steps for a status. */
export function propertyColumn(
  name: string,
  type: ColumnSpec['type'],
  options: string[],
  format?: string,
): ColumnSpec {
  return {
    name,
    type,
    ...((type === 'select' || type === 'multi_select') && { options }),
    ...(type === 'status' && { groups: DEFAULT_STATUS_GROUPS }),
    ...(format && { format }),
  } as ColumnSpec
}

/** The rows a relation can point at, by title; null when its table is gone or cannot be read. */
export async function relationChoices(host: PaperHost, target: string): Promise<Choice[] | null> {
  try {
    const [spec, result] = await Promise.all([
      host.describeTable(target),
      host.runQuery({ table: target, limit: RELATION_CHOICE_LIMIT }),
    ])
    if (!spec) return null
    const title = titleColumn(spec)?.name
    return result.rows.map((row) => ({
      value: String(row.id),
      label:
        title && typeof row[title] === 'string' && row[title] ? String(row[title]) : 'Untitled',
    }))
  } catch {
    return null
  }
}

/** What a cell sorts by: a choice by its place in the column, a person by name; null is empty. */
function sortKey(column: ColumnSpec, cell: Cell | undefined, people: Person[]) {
  if (cell === undefined || cell === null || cell === '') return null
  const first = Array.isArray(cell) ? cell[0] : cell
  if (first === undefined) return null
  if (column.type === 'relation' && Array.isArray(cell)) return cell.length
  if (CHOICE_TYPES.has(column.type)) {
    const at = choicesFor(column, people).findIndex((choice) => choice.value === first)
    return at < 0 ? Number.MAX_SAFE_INTEGER : at
  }
  if (column.type === 'person') return people.find((each) => each.id === first)?.name ?? first
  if (typeof first === 'boolean') return first ? 1 : 0
  return first
}

/** A reader's sort over the rows loaded; empty cells stay last either way, ties keep their order. */
export function sortRows(
  rows: QueryRow[],
  column: ColumnSpec,
  direction: SortDirection,
  people: Person[],
): QueryRow[] {
  const sign = direction === 'asc' ? 1 : -1
  return rows
    .map((row, at) => ({ row, at, key: sortKey(column, row[column.name], people) }))
    .sort((a, b) => {
      if (a.key === null || b.key === null) {
        return a.key === b.key ? a.at - b.at : a.key === null ? 1 : -1
      }
      const order =
        typeof a.key === 'number' && typeof b.key === 'number'
          ? a.key - b.key
          : String(a.key).localeCompare(String(b.key), undefined, { numeric: true })
      return sign * order || a.at - b.at
    })
    .map(({ row }) => row)
}

/** A choice column's options as its menu lists them: a status by its three groups. */
export function optionGroups(column: ColumnSpec): OptionGroup[] {
  if (column.type !== 'status' || !column.groups) {
    return [{ label: null, options: column.options ?? [] }]
  }
  const groups = column.groups
  return STATUS_GROUP_LABELS.map(({ group, label }) => ({ group, label, options: groups[group] }))
}

/** The warning before an option in use goes: how many rows hold it, and what becomes of them. */
export function optionRemovalWords({ option, count }: OptionRemoval): string {
  if (count === null) return `Rows that hold “${option}” will be left empty.`
  const many = count >= OPTION_USE_LIMIT ? `At least ${count} rows hold` : `${count} rows hold`
  const holders = count === 1 ? '1 row holds' : many
  return `${holders} “${option}” — removing it leaves ${count === 1 ? 'it' : 'them'} empty.`
}

/** ↑ ↓ walk a menu's fields and items as a native menu does; Home and End jump, outside a field. */
export function walkMenu(event: KeyboardEvent<HTMLElement>): void {
  const typing = event.target instanceof HTMLInputElement
  const jump = !typing && (event.key === 'Home' || event.key === 'End')
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && !jump) return
  const items = [
    ...event.currentTarget.querySelectorAll<HTMLElement>('input, [role="menuitem"]'),
  ].filter((item) => !item.hasAttribute('disabled'))
  if (items.length === 0) return
  event.preventDefault()
  const at = items.indexOf(document.activeElement as HTMLElement)
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? items.length - 1
        : event.key === 'ArrowDown'
          ? (at + 1) % items.length
          : (at <= 0 ? items.length : at) - 1
  items[next]?.focus()
}
