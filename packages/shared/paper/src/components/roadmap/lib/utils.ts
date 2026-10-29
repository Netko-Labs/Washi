import type { Calendar, Span, Tick } from './types'

const DAY_MS = 86_400_000
const MIN_DAYS = 28
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

/** The days on screen: every bar, a little air either side, and never less than four weeks. */
/** A row's bar: its `date` alone, or from `date` to a separate `end` column when one is named. */
export function rowSpan(row: Record<string, unknown>, date: string, end?: string): Span | null {
  const start = row[date]
  const until = end ? row[end] : null
  return typeof start === 'string' && typeof until === 'string' && until
    ? spanOf(`${start.split('/')[0]}/${until}`)
    : spanOf(start)
}

/** What a dragged bar writes: one range column, or its start and end columns each moved. */
export function moved(
  span: Span,
  days: number,
  date: string,
  end?: string,
): Record<string, string> {
  if (!end) return { [date]: shift(span, days) }
  return { [date]: toIso(span.start + days), [end]: toIso(span.end + days) }
}

export function calendarOf(spans: Span[], now = today()): Calendar {
  const first = Math.min(now, ...spans.map((span) => span.start)) - PAD_DAYS
  const last = Math.max(now, ...spans.map((span) => span.end)) + PAD_DAYS
  return { first, days: Math.max(MIN_DAYS, last - first + 1) }
}

export function shift(span: Span, days: number): string {
  const start = toIso(span.start + days)
  return span.end === span.start ? start : `${start}/${toIso(span.end + days)}`
}

const LABEL = { month: 'short', day: 'numeric', timeZone: 'UTC' } as const
/** The last days of a track: a tick there would run its label off the edge. */
const TICK_TAIL = 0.12

/** Mondays for a short calendar, the 1st of each month for a long one; none in the last stretch. */
export function ticksOf(calendar: Calendar): Tick[] {
  const monthly = calendar.days > 120
  const ticks: Tick[] = []
  const stop = calendar.first + calendar.days * (1 - TICK_TAIL)
  for (let day = calendar.first; day < stop; day++) {
    const date = new Date(day * DAY_MS)
    const marks = monthly ? date.getUTCDate() === 1 : date.getUTCDay() === 1
    if (marks) ticks.push({ day, label: date.toLocaleDateString(undefined, LABEL) })
  }
  return ticks
}

export const percent = (day: number, calendar: Calendar) =>
  `${((day - calendar.first) / calendar.days) * 100}%`
