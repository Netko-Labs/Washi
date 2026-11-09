import type { RequestedAsk } from '@washi/domain'
import { insideWindow, isOpenCell, type Span, spanOf, spansOverlap } from '@washi/paper/registry'
import { pendingSuggestionsFor, type Workspace } from '@washi/repository'
import { runQuery } from '../tables/service'
import { SPAN_LOOKBACK_DAYS, TAKEN_SCAN_ROWS } from './constants'
import type { TakenOptions } from './types'

const dayKey = (minutes: number) => new Date(minutes * 60_000).toISOString().slice(0, 10)
/** Wall-clock minutes as a date cell's start: `2026-11-03T10:00`. */
const momentAt = (minutes: number) => new Date(minutes * 60_000).toISOString().slice(0, 16)

/**
 * Pending times on `table`'s `date` column inside `[from, to)` — the bare cells, nobody's name:
 * what a calendar draws as Requested and a booking may not ask for again.
 */
export function requestedSpans(ws: Workspace, ask: RequestedAsk): string[] {
  const window = spanOf(`${ask.from}/${ask.to}`)
  if (!window) return []
  return pendingSuggestionsFor(ws, ask.table).flatMap((suggestion) => {
    const cell = suggestion.cells[ask.date]
    const span = spanOf(cell)
    return typeof cell === 'string' && span && spansOverlap(span, window) ? [cell] : []
  })
}

/** Whether a row, or with `pending` another suggestion, already holds any of `span`. */
export function takenBy(
  ws: Workspace,
  table: string,
  date: string,
  span: Span,
  { minutes, pending, show }: TakenOptions,
): 'booked' | 'requested' | null {
  const from = dayKey(span.from - SPAN_LOOKBACK_DAYS * 24 * 60)
  const to = dayKey(span.to + 24 * 60)
  const { rows } = runQuery(ws, {
    table,
    where: [
      { column: date, op: 'gte', value: from },
      { column: date, op: 'lt', value: to },
    ],
    orderBy: { column: date, direction: 'asc' },
    limit: TAKEN_SCAN_ROWS,
  })
  const overlaps = (cell: unknown) => {
    const held = spanOf(cell, minutes)
    return held !== null && spansOverlap(held, span)
  }
  // An Open window is where a booking goes, not what takes the time (D133).
  const holding = show ? rows.filter((row) => !isOpenCell(row[show])) : rows
  if (holding.some((row) => overlaps(row[date]))) return 'booked'
  // A window too busy to read whole is never called free.
  if (rows.length >= TAKEN_SCAN_ROWS) return 'booked'
  if (!pending) return null
  const asked = requestedSpans(ws, { table, date, from, to })
  return asked.some(overlaps) ? 'requested' : null
}

/**
 * Whether `span` sits wholly inside a row the Show-as column marks Open (D133) — the only times a
 * Slots with `show` offers, and so the only ones a visitor may ask for.
 */
export function insideOpenWindow(
  ws: Workspace,
  table: string,
  date: string,
  show: string,
  span: Span,
): boolean {
  const from = dayKey(span.from - SPAN_LOOKBACK_DAYS * 24 * 60)
  // Only rows that could hold the span are read: Open ones starting at or before it, the latest
  // first — the nearest is the likeliest to contain it — so no other row pushes it past the scan.
  // A date cell starts with its start, so it compares as one; `< …T09:01` keeps a window that opens
  // exactly at 09:00 (`2026-11-03T09:00/…` sorts after `…T09:00` itself).
  const { rows } = runQuery(ws, {
    table,
    where: [
      { column: date, op: 'gte', value: from },
      { column: date, op: 'lt', value: momentAt(span.from + 1) },
      { column: show, op: 'contains', value: 'open' },
    ],
    orderBy: { column: date, direction: 'desc' },
    limit: TAKEN_SCAN_ROWS,
  })
  const windows = rows.flatMap((row) => {
    const window = isOpenCell(row[show]) ? spanOf(row[date]) : null
    return window ? [window] : []
  })
  return insideWindow(span, windows)
}
