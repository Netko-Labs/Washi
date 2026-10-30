import type { TableSpec } from '@washi/ink'
import type { ActionRef } from '../../../../lib/types'
import { AGENDA_COPY_LIMIT, BOARD_RANK_COLUMN, DAY_MS } from '../constants'
import type { AgendaColumns, CopyEntries, CopyPlan, Row, WeekdayChip, WeekStart } from '../types'

const DAY_PART = /^(\d{4})-(\d{2})-(\d{2})/

/** A day key as a whole number of days: UTC midnight, so no zone or DST shift ever reaches it. */
function dayNumber(value: string): number | null {
  const match = DAY_PART.exec(value)
  if (!match) return null
  const at = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(at) ? null : Math.round(at / DAY_MS)
}

function dayKey(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10)
}

/** Whole days from one day key to another, both read off their leading `YYYY-MM-DD`. */
export function dayGap(from: string, to: string): number | null {
  const [start, end] = [dayNumber(from), dayNumber(to)]
  return start === null || end === null ? null : end - start
}

export function shiftDay(key: string, days: number): string {
  const day = dayNumber(key)
  return day === null ? key : dayKey(day + days)
}

/** Each `/` part that starts with a day moves by `days`; its time of day and the rest stay. */
export function shiftCell(cell: string, days: number): string {
  return cell
    .split('/')
    .map((part) => {
      const day = dayNumber(part)
      return day === null ? part : `${dayKey(day + days)}${part.slice(10)}`
    })
    .join('/')
}

/**
 * The days after the event's first (exclusive) through `through` (inclusive) on `weekdays`
 * (0 = Sunday), each cell the event's moved there. Past the limit it stops and says so.
 */
export function copyDates(event: string, through: string, weekdays: readonly number[]): CopyPlan {
  const plan: CopyPlan = { days: [], shifts: [], cells: [], isOver: false }
  const first = dayNumber(event)
  const last = dayNumber(through)
  if (first === null || last === null || weekdays.length === 0) return plan
  for (let day = first + 1; day <= last; day++) {
    if (!weekdays.includes(new Date(day * DAY_MS).getUTCDay())) continue
    if (plan.days.length === AGENDA_COPY_LIMIT) {
      plan.isOver = true
      break
    }
    plan.days.push(dayKey(day))
    plan.shifts.push(day - first)
    plan.cells.push(shiftCell(event, day - first))
  }
  return plan
}

/** What a copy moved `days` writes: the date, and a time or end column that holds a day too. */
export function copyPatch(row: Row, columns: AgendaColumns, days: number): Record<string, string> {
  const patch: Record<string, string> = {}
  for (const column of new Set([columns.date, columns.time, columns.end])) {
    const cell = column ? row[column] : null
    if (column && typeof cell === 'string' && dayNumber(cell) !== null) {
      patch[column] = shiftCell(cell, days)
    }
  }
  return patch
}

/** One press, one action: the row copied once per entry, all or none (D76's `table.copy`). */
export function copyAction(
  table: string,
  id: string,
  entries: CopyEntries,
  spec: TableSpec | null,
): ActionRef {
  const isRanked = spec?.columns.some(
    (column) => column.name === BOARD_RANK_COLUMN && column.type === 'number',
  )
  return {
    verb: 'table.copy',
    table,
    where: [{ column: 'id', op: 'eq', value: id }],
    set: isRanked ? { [BOARD_RANK_COLUMN]: null } : {},
    each: entries.length > 0 ? entries : [{}],
  }
}

function dayDate(key: string): Date {
  return new Date((dayNumber(key) ?? 0) * DAY_MS)
}

const dayFormat = (locale?: string) =>
  new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })

/** "Wed, Nov 4", on the wall clock the key names. */
export function dayWords(key: string, locale?: string): string {
  return dayFormat(locale).format(dayDate(key))
}

/** "Adds 4 events: Tue 3 Nov – Fri 6 Nov, 10:00–11:00" (the locale's range), or why none. */
export function repeatWords(plan: CopyPlan, time: string | null, locale?: string): string {
  if (plan.isOver) {
    return `That is more than ${AGENDA_COPY_LIMIT} events — at most ${AGENDA_COPY_LIMIT} at once; pick an earlier date.`
  }
  const [first, last] = [plan.days[0], plan.days.at(-1)]
  if (!first || !last) return 'No day matches — pick a later date or another weekday.'
  const days =
    first === last
      ? dayWords(first, locale)
      : dayFormat(locale).formatRange(dayDate(first), dayDate(last))
  const count = plan.days.length
  return `Adds ${count} ${count === 1 ? 'event' : 'events'}: ${days}${time ? `, ${time}` : ''}`
}

/** The seven weekdays in the agenda's own order, named in the reader's words. */
export function weekdayChips(weekStart: WeekStart, locale?: string): WeekdayChip[] {
  const first = weekStart === 'monday' ? 1 : 0
  const format = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' })
  return Array.from({ length: 7 }, (_, index) => {
    const day = (first + index) % 7
    return { day, label: format.format(new Date(Date.UTC(2026, 10, 1 + day))) }
  })
}

export function isSameDays(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((day) => b.includes(day))
}
