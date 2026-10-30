import type { Calendar, DrawnSpan, Span, Tick } from './types'

const DAY_MS = 86_400_000
const MIN_DAYS = 28
const MAX_DAYS = 3 * 365 + 1
const PAD_DAYS = 3

const toDay = (iso: string) => Math.floor(Date.parse(iso.slice(0, 10)) / DAY_MS)
export const toIso = (day: number) => new Date(day * DAY_MS).toISOString().slice(0, 10)
export const today = () => Math.floor(Date.now() / DAY_MS)

/** `2026-10-01` or `2026-10-01/2026-10-14` → inclusive day numbers; anything else has no bar. */
export function spanOf(value: unknown): Span | null {
  if (typeof value !== 'string' || !value) return null
  const [start = '', end = start] = value.split('/')
  if (Number.isNaN(Date.parse(start)) || Number.isNaN(Date.parse(end))) return null
  return { start: toDay(start), end: Math.max(toDay(start), toDay(end)) }
}

/** A row's bar: its `date` alone, or from `date` to a separate `end` column when one is named. */
export function rowSpan(row: Record<string, unknown>, date: string, end?: string): Span | null {
  const start = row[date]
  const until = end ? row[end] : null
  return typeof start === 'string' && typeof until === 'string' && until
    ? spanOf(`${start.split('/')[0]}/${until}`)
    : spanOf(start)
}

/**
 * What a dragged bar writes: its start and end columns each moved when the row has an end;
 * otherwise its date column whole — a range stays a range.
 */
export function moved(
  span: Span,
  days: number,
  date: string,
  end?: string,
): Record<string, string> {
  if (!end) return { [date]: shift(span, days) }
  return { [date]: toIso(span.start + days), [end]: toIso(span.end + days) }
}

/**
 * What placing a bar on an empty row writes: the day as its start. A stored end before that day
 * moves up to it, so a row never holds an end before its start.
 */
export function placed(
  day: number,
  row: Record<string, unknown>,
  date: string,
  end?: string,
): Record<string, string> {
  const until = end ? spanOf(row[end]) : null
  return until && until.end < day
    ? { [date]: toIso(day), [end as string]: toIso(day) }
    : { [date]: toIso(day) }
}

/**
 * The days on screen: every bar, a little air either side, never less than four weeks and never
 * more than three years — past that, the three years around the middle of the starts and today.
 */
export function calendarOf(spans: Span[], now = today()): Calendar {
  const first = Math.min(now, ...spans.map((span) => span.start)) - PAD_DAYS
  const last = Math.max(now, ...spans.map((span) => span.end)) + PAD_DAYS
  if (last - first < MAX_DAYS) return { first, days: Math.max(MIN_DAYS, last - first + 1) }
  const starts = [now, ...spans.map((span) => span.start)].sort((a, b) => a - b)
  const middle = starts[Math.floor(starts.length / 2)] ?? now
  const from = Math.max(first, middle - Math.floor(MAX_DAYS / 2))
  return { first: Math.min(from, last - MAX_DAYS + 1), days: MAX_DAYS }
}

/** A span held inside the calendar, and the side it was cut on when it runs past an edge. */
export function drawnOf(span: Span, calendar: Calendar): DrawnSpan {
  const last = calendar.first + calendar.days - 1
  const clamp = (day: number) => Math.min(Math.max(day, calendar.first), last)
  const before = span.start < calendar.first
  const after = span.end > last
  const cut = before && after ? 'both' : before ? 'start' : after ? 'end' : undefined
  return { start: clamp(span.start), end: clamp(span.end), cut }
}

export const isOnCalendar = (day: number, calendar: Calendar) =>
  day >= calendar.first && day < calendar.first + calendar.days

export function shift(span: Span, days: number): string {
  const start = toIso(span.start + days)
  return span.end === span.start ? start : `${start}/${toIso(span.end + days)}`
}

const LABEL = { month: 'short', day: 'numeric', timeZone: 'UTC' } as const
/** The last days of a track: a tick there would run its label off the edge. */
const TICK_TAIL = 0.12

/**
 * Mondays for a short calendar, the 1st of each month for a long one, of each quarter past a year
 * and a half; none in the last stretch.
 */
export function ticksOf(calendar: Calendar): Tick[] {
  const stop = calendar.first + calendar.days * (1 - TICK_TAIL)
  const days =
    calendar.days > 120
      ? monthStarts(calendar.first, stop, calendar.days > 540 ? 3 : 1)
      : mondays(calendar.first, stop)
  return days.map((day) => ({
    day,
    label: new Date(day * DAY_MS).toLocaleDateString(undefined, LABEL),
  }))
}

function mondays(first: number, stop: number): number[] {
  const days: number[] = []
  const weekday = new Date(first * DAY_MS).getUTCDay()
  for (let day = first + ((8 - weekday) % 7); day < stop; day += 7) days.push(day)
  return days
}

/** `setUTCFullYear`, not `Date.UTC`: that one reads the years 0–99 as 1900–1999. */
function monthStarts(first: number, stop: number, step: number): number[] {
  const days: number[] = []
  const date = new Date(first * DAY_MS)
  const year = date.getUTCFullYear()
  const next = date.getUTCMonth() + (date.getUTCDate() === 1 ? 0 : 1)
  for (let month = Math.ceil(next / step) * step; ; month += step) {
    date.setUTCFullYear(year, month, 1)
    const day = Math.round(date.getTime() / DAY_MS)
    if (day >= stop) return days
    days.push(day)
  }
}

export const percent = (day: number, calendar: Calendar) =>
  `${((day - calendar.first) / calendar.days) * 100}%`
