import { wallKey, wallMinute } from '@washi/domain'
import type { Cell } from '@washi/ink'
import { DAY_PATTERN } from './constants'

/** `YYYY-MM-DD` on the wall clock of a zone. */
export function dayIn(now: Date, timeZone: string): string {
  return wallKey(wallMinute(now, timeZone)).slice(0, 10)
}

/** Calendar arithmetic on a `YYYY-MM-DD`, deaf to daylight saving. */
export function addDays(day: string, days: number): string {
  const [year, month, date] = day.split('-').map(Number)
  return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, (date ?? 1) + days))
    .toISOString()
    .slice(0, 10)
}

/** A date cell's day as written: a datetime's date, a range's start. */
export function dueDayOf(cell: Cell | undefined): string | null {
  if (typeof cell !== 'string') return null
  const day = cell.slice(0, 10)
  return DAY_PATTERN.test(day) ? day : null
}
