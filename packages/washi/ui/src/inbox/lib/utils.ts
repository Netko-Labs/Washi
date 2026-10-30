import type { TodayTurn } from '../../today'
import { DAY_MS } from './constants'
import type { DayGroup, InboxFilter, InboxRow } from './types'
import { TURN_LEFT } from './values'

const MINUTE = 60_000
const HOUR = 60 * MINUTE

function startOfDay(ms: number): number {
  const date = new Date(ms)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

/** `Today` · `Yesterday` · a weekday inside the week · `Tue 14 Oct` beyond it. */
export function dayLabel(at: number, now: number): string {
  const days = Math.round((startOfDay(now) - startOfDay(at)) / DAY_MS)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  const date = new Date(at)
  if (days < 7) return date.toLocaleDateString('en', { weekday: 'long' })
  const weekday = date.toLocaleDateString('en', { weekday: 'short' })
  const month = date.toLocaleDateString('en', { month: 'short' })
  return `${weekday} ${date.getDate()} ${month}`
}

/** The time on the right of a row: fresh rows count, today's rows tell the time, older ones the day. */
export function whenLabel(at: number, now: number): string {
  const gap = Math.max(0, now - at)
  if (gap < MINUTE) return 'now'
  if (gap < HOUR) return `${Math.floor(gap / MINUTE)} min`
  if (gap < 6 * HOUR) return `${Math.floor(gap / HOUR)} h`
  const date = new Date(at)
  if (startOfDay(at) === startOfDay(now)) {
    return date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false })
  }
  return date.toLocaleDateString('en', { weekday: 'short' })
}

/** Newest first, cut by day; the day's rows keep that order. */
export function groupByDay(rows: InboxRow[], now: number): DayGroup[] {
  const sorted = [...rows].sort((a, b) => b.at - a.at)
  const groups: DayGroup[] = []
  for (const row of sorted) {
    const label = dayLabel(row.at, now)
    const last = groups[groups.length - 1]
    if (last?.label === label) last.rows.push(row)
    else groups.push({ label, rows: [row] })
  }
  return groups
}

/** What Washi did, in one line: the page it wrote, else what it said, else where it was left. */
export function turnRow(turn: TodayTurn): InboxRow {
  const { outcome, receipt } = turn
  const said =
    outcome?.kind === 'page'
      ? { verb: outcome.touch === 'made' ? 'made' : 'updated', where: outcome.title }
      : outcome?.kind === 'table'
        ? { verb: `moved the table “${outcome.name}” to the trash`, where: null }
        : outcome?.kind === 'reply'
          ? { verb: `replied “${outcome.text}”`, where: null }
          : { verb: TURN_LEFT[receipt.stopReason], where: turn.sessionTitle }
  return {
    id: `${turn.sessionId}-${turn.at}`,
    kind: 'washi',
    at: turn.at,
    who: null,
    ...said,
    detail: receipt.stopReason === 'error' ? (receipt.error ?? 'failed') : null,
  }
}

export function matchesFilter(row: InboxRow, filter: InboxFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'needs') return Boolean(row.actions?.length)
  return filter === 'mentions' ? row.kind === 'mention' : row.kind === 'washi'
}
