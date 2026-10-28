import type { BindQuery } from '../../../registry'
import { AGENDA_HUES, AGENDA_ROW_LIMIT } from './constants'
import type { AgendaColumns, AgendaDayInfo, AgendaSpan, Row, WeekStart } from './types'

const DAY_KEY = /^(\d{4}-\d{2}-\d{2})/
const MONTH_KEY = /^(\d{4})-(\d{2})(?:-\d{2})?$/

/** A calendar day on the reader's own clock — never UTC's, or a late evening lands tomorrow. */
export function isoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

/** Monday (or Sunday) of the week `offset` weeks from the one holding `now`. */
export function weekStartOf(now: Date, weekStart: WeekStart, offset: number): Date {
  const first = weekStart === 'monday' ? 1 : 0
  const back = (now.getDay() - first + 7) % 7
  return addDays(now, offset * 7 - back)
}

/** `count` days from `start`; with `month`, the days of other months are marked outside it. */
export function spanDays(
  start: Date,
  count: number,
  today: string,
  locale?: string,
  month?: number,
): AgendaDayInfo[] {
  return Array.from({ length: count }, (_, index) => {
    const date = addDays(start, index)
    const key = isoDay(date)
    return {
      key,
      weekday: date.toLocaleDateString(locale, { weekday: 'short' }),
      day: date.getDate(),
      long: date.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' }),
      isToday: key === today,
      isOutside: month !== undefined && date.getMonth() !== month,
    }
  })
}

export function weekSpan(start: Date, today: string, locale?: string): AgendaSpan {
  return { start, days: spanDays(start, 7, today, locale), label: weekLabel(start, locale) }
}

/** Whole weeks around the month, so its grid is a rectangle: four to six rows. */
export function monthSpan(
  first: Date,
  weekStart: WeekStart,
  today: string,
  locale?: string,
): AgendaSpan {
  const start = weekStartOf(first, weekStart, 0)
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0)
  const weeks = Math.ceil((daysBetween(start, last) + 1) / 7)
  return {
    start,
    days: spanDays(start, weeks * 7, today, locale, first.getMonth()),
    label: first.toLocaleDateString(locale, { month: 'long', year: 'numeric' }),
  }
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000)
}

/** The first of the month a `YYYY-MM` (or a whole day) names; anything else is no month. */
export function monthOf(value: unknown): Date | null {
  const match = typeof value === 'string' ? MONTH_KEY.exec(value) : null
  if (!match) return null
  const month = Number(match[2])
  return month >= 1 && month <= 12 ? new Date(Number(match[1]), month - 1, 1) : null
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

/** "Oct 26 – Nov 1, 2026", "Nov 2 – 8, 2026": the locale's own range, each part said once. */
export function weekLabel(start: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).formatRange(start, addDays(start, 6))
}

/** The page's own query, held to the days on screen and read in date order. */
export function rangeQuery(bind: BindQuery, date: string, from: string, to: string): BindQuery {
  return {
    ...bind,
    where: [
      ...(bind.where ?? []),
      { column: date, op: 'gte', value: from },
      { column: date, op: 'lt', value: to },
    ],
    orderBy: bind.orderBy ?? { column: date, direction: 'asc' },
    limit: Math.min(bind.limit ?? AGENDA_ROW_LIMIT, AGENDA_ROW_LIMIT),
  }
}

export function dayKeyOf(cell: unknown): string | null {
  return typeof cell === 'string' ? (DAY_KEY.exec(cell)?.[1] ?? null) : null
}

export function rowsByDay(rows: Row[], date: string): Map<string, Row[]> {
  const days = new Map<string, Row[]>()
  for (const row of rows) {
    const key = dayKeyOf(row[date])
    if (key) days.set(key, [...(days.get(key) ?? []), row])
  }
  return days
}

function text(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  return String(value)
}

/** A time column may hold `09:00` or a whole `2026-10-28T09:00`; either reads as `09:00`. */
function clock(value: unknown): string | null {
  const read = text(value)
  if (!read) return null
  const match = /T?(\d{1,2}:\d{2})/.exec(read)
  return match?.[1] ?? read
}

export function eventTime(row: Row, columns: AgendaColumns): string | null {
  const from = columns.time ? clock(row[columns.time]) : null
  const to = columns.end ? clock(row[columns.end]) : null
  if (from && to) return `${from}–${to}`
  return from ?? to
}

/** The named column, else the row's first word that is not its date or id. */
export function eventTitle(row: Row, columns: AgendaColumns): string {
  const named = columns.title ? text(row[columns.title]) : null
  if (named) return named
  const fallback = Object.entries(row).find(
    ([key, value]) =>
      key !== 'id' && key !== columns.date && typeof value === 'string' && !DAY_KEY.test(value),
  )
  return fallback ? String(fallback[1]) : 'Untitled'
}

/** One hue per badge value, stable across weeks and readers. */
export function hueOf(value: string | null): number | undefined {
  if (!value) return undefined
  let hash = 0
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return (hash % AGENDA_HUES) + 1
}

export function badgeOf(row: Row, columns: AgendaColumns): string | null {
  return columns.badge ? text(row[columns.badge]) : null
}
