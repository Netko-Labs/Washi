import type { RowChange, RowFieldChange } from '@washi/domain'
import { isRank } from '@washi/paper'
import { DAY_MS, TEXT_PREVIEW_CHARS } from './constants'
import type {
  ActivityDay,
  ActivityCell as Cell,
  ActivityColumn as Column,
  PhraseContext,
} from './types'

function startOfDay(ms: number): number {
  const day = new Date(ms)
  day.setHours(0, 0, 0, 0)
  return day.getTime()
}

function shortDate(date: Date, now: number): string {
  const sameYear = date.getFullYear() === new Date(now).getFullYear()
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(!sameYear && { year: 'numeric' }),
  })
}

export function dayLabel(ms: number, now: number): string {
  const days = Math.round((startOfDay(now) - startOfDay(ms)) / DAY_MS)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return shortDate(new Date(ms), now)
}

const isEmpty = (cell: Cell) =>
  cell === null || cell === '' || (Array.isArray(cell) && !cell.length)

/** A date cell is `YYYY-MM-DD`, or `start/end` for a range — read on the local calendar. */
function dateText(value: string, now: number): string {
  return value
    .split('/')
    .map((part) => {
      const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(part) ? `${part}T00:00` : part)
      return Number.isNaN(date.getTime()) ? part : shortDate(date, now)
    })
    .join(' – ')
}

function cellText(cell: Cell, column: Column | undefined, context: PhraseContext, now: number) {
  const nameOf = (id: string) =>
    column?.type === 'person'
      ? (context.people.find((person) => person.id === id)?.name ?? 'someone')
      : column?.type === 'relation'
        ? (context.related[id] ?? 'a row')
        : id
  if (Array.isArray(cell)) return cell.map(nameOf).join(', ')
  if (typeof cell === 'number') return cell.toLocaleString()
  if (typeof cell === 'boolean') return cell ? 'yes' : 'no'
  if (cell === null) return ''
  if (column?.type === 'date') return dateText(cell, now)
  if (column?.type === 'person' || column?.type === 'relation') return nameOf(cell)
  const clipped = cell.length > TEXT_PREVIEW_CHARS ? `${cell.slice(0, TEXT_PREVIEW_CHARS)}…` : cell
  return column?.type === 'text' || column?.type === 'url' ? `“${clipped}”` : clipped
}

function fieldPhrase(field: RowFieldChange, context: PhraseContext, now: number): string | null {
  const column = context.spec.columns.find((each) => each.name === field.column)
  if (column && isRank(column)) return null
  const label = field.column.replace(/_/g, ' ')
  if (column?.type === 'boolean' || typeof field.to === 'boolean') {
    return `${field.to === true ? 'ticked' : 'unticked'} ${label}`
  }
  if (isEmpty(field.to)) return `cleared ${label}`
  const to = cellText(field.to, column, context, now)
  if (isEmpty(field.from)) return `set ${label} to ${to}`
  return `set ${label} ${cellText(field.from, column, context, now)} → ${to}`
}

function changePhrase(change: RowChange, context: PhraseContext, now: number): string | null {
  if (change.kind === 'created') return 'added this row'
  if (change.kind === 'deleted') return 'removed this row'
  if (change.kind === 'restored') return 'restored this row'
  const phrases = change.fields.flatMap((field) => fieldPhrase(field, context, now) ?? [])
  return phrases.length > 0 ? phrases.join(', ') : null
}

function whoOf(by: string | null, context: PhraseContext): string {
  if (by === 'washi') return 'Washi'
  if (by === 'automation') return 'An automation'
  return context.people.find((person) => person.id === by)?.name ?? 'Someone'
}

/** Newest first, one group per calendar day; a change that only moved the board order is dropped. */
export function activityByDay(
  changes: RowChange[],
  context: PhraseContext,
  now = Date.now(),
): ActivityDay[] {
  const days: ActivityDay[] = []
  changes.forEach((change, index) => {
    const what = changePhrase(change, context, now)
    if (!what) return
    const label = dayLabel(change.atMs, now)
    const entry = {
      key: `${change.atMs}-${index}`,
      who: whoOf(change.by, context),
      what,
      time: new Date(change.atMs).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
    const last = days.at(-1)
    if (last?.label === label) last.entries.push(entry)
    else days.push({ label, entries: [entry] })
  })
  return days
}
