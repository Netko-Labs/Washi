import type { Row } from '../../../lib/types'
import type { BindQuery } from '../../../registry'
import { DAY_MS, HEAT_LEVELS, HEAT_ROW_LIMIT } from './constants'
import type { HeatCell, HeatGrid } from './types'

const keyOf = (day: number) => new Date(day * DAY_MS).toISOString().slice(0, 10)
const dayOf = (key: string) => Math.floor(Date.parse(`${key}T00:00:00Z`) / DAY_MS)

/** The first day shown: `weeks` whole weeks back, starting on the week's first day. */
export function firstDay(today: string, weeks: number, weekStart: 'monday' | 'sunday'): number {
  const now = dayOf(today)
  const weekday = new Date(now * DAY_MS).getUTCDay()
  const back = weekStart === 'monday' ? (weekday + 6) % 7 : weekday
  return now - back - (weeks - 1) * 7
}

/** The page's query held to the days on screen. */
export function heatQuery(bind: BindQuery, date: string, from: number): BindQuery {
  return {
    ...bind,
    where: [...(bind.where ?? []), { column: date, op: 'gte', value: keyOf(from) }],
    limit: Math.min(bind.limit ?? HEAT_ROW_LIMIT, HEAT_ROW_LIMIT),
  }
}

/** Each day's total: rows counted, or `value` summed; a moment or a range counts on its first day. */
export function totalsByDay(rows: Row[], date: string, value?: string): Map<string, number> {
  const totals = new Map<string, number>()
  for (const row of rows) {
    const key = String(row[date] ?? '').slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue
    const add = value ? Number(row[value]) || 0 : 1
    totals.set(key, (totals.get(key) ?? 0) + add)
  }
  return totals
}

/** The grid: whole weeks from `from`, each day leveled against the busiest day on screen. */
export function heatGrid(
  totals: Map<string, number>,
  from: number,
  weeks: number,
  today: string,
  locale?: string,
): HeatGrid {
  const now = dayOf(today)
  const last = from + weeks * 7 - 1
  const shown = [...totals.entries()].filter(([key]) => dayOf(key) >= from && dayOf(key) <= last)
  const max = Math.max(0, ...shown.map(([, total]) => total))
  const columns: HeatCell[][] = []
  const months: string[] = []
  let lastMonth = -1
  for (let week = 0; week < weeks; week++) {
    const days: HeatCell[] = []
    for (let offset = 0; offset < 7; offset++) {
      const day = from + week * 7 + offset
      const key = keyOf(day)
      const total = totals.get(key) ?? 0
      const level = total > 0 && max > 0 ? Math.max(1, Math.ceil((total / max) * HEAT_LEVELS)) : 0
      days.push({ key, total, level, isFuture: day > now })
    }
    const month = new Date((from + week * 7) * DAY_MS).getUTCMonth()
    months.push(
      month !== lastMonth
        ? new Date((from + week * 7) * DAY_MS).toLocaleDateString(locale, {
            month: 'short',
            timeZone: 'UTC',
          })
        : '',
    )
    lastMonth = month
    columns.push(days)
  }
  const total = shown.filter(([key]) => dayOf(key) <= now).reduce((sum, [, n]) => sum + n, 0)
  return { weeks: columns, months, total }
}
