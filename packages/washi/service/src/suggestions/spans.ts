import type { RequestedAsk } from '@washi/domain'
import { type Span, spanOf, spansOverlap } from '@washi/paper/registry'
import { pendingSuggestionsFor, type Workspace } from '@washi/repository'
import { runQuery } from '../tables/service'
import { SPAN_LOOKBACK_DAYS, TAKEN_SCAN_ROWS } from './constants'
import type { TakenOptions } from './types'

const dayKey = (minutes: number) => new Date(minutes * 60_000).toISOString().slice(0, 10)

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
  { minutes, pending }: TakenOptions,
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
  if (rows.some((row) => overlaps(row[date]))) return 'booked'
  // A window too busy to read whole is never called free.
  if (rows.length >= TAKEN_SCAN_ROWS) return 'booked'
  if (!pending) return null
  const asked = requestedSpans(ws, { table, date, from, to })
  return asked.some(overlaps) ? 'requested' : null
}
