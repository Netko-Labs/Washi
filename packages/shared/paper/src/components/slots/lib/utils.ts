import type { Row } from '../../../lib/types'
import { DAY_MINUTES, WEEKDAYS } from './constants'
import type { Busy, DaySlot, Slot, Weekday, WeekStart } from './types'

const MOMENT = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2}))?/

/** Wall-clock minutes for `2026-10-29` or `2026-10-29T10:00` — zones never enter. */
export function minutesOf(value: string): number | null {
  const match = MOMENT.exec(value)
  if (!match?.[1]) return null
  const day = Date.parse(`${match[1]}T00:00:00Z`) / 60_000
  return day + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0)
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Wall-clock minutes back to `2026-10-29T10:00`. */
export function momentOf(minutes: number): string {
  const date = new Date(minutes * 60_000)
  return `${date.toISOString().slice(0, 10)}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
}

export function weekdayOf(dayKey: string): Weekday {
  return WEEKDAYS[new Date(`${dayKey}T00:00:00Z`).getUTCDay()] ?? 'mon'
}

/**
 * What each row takes: its `start/end`, a single moment for `minutes`, or a bare day whole.
 * A row with nothing readable takes nothing.
 */
export function busyOf(rows: Row[], date: string, minutes: number): Busy[] {
  return rows.flatMap((row): Busy[] => {
    const [start = '', end] = String(row[date] ?? '').split('/')
    const from = minutesOf(start)
    if (from === null) return []
    const until = end ? minutesOf(end) : null
    if (until !== null) return [{ from, to: until }]
    return [{ from, to: from + (start.includes('T') ? minutes : DAY_MINUTES) }]
  })
}

/**
 * A day's slots: its hours cut into `minutes`, none before `now`, those under `busy` booked and
 * those under `held` — times visitors asked for, still pending — requested.
 */
export function slotsOn(
  dayKey: string,
  hours: string,
  minutes: number,
  busy: Busy[],
  now: number,
  held: Busy[] = [],
): DaySlot[] {
  const [open = '09:00', close = '17:00'] = hours.split('-')
  const first = minutesOf(`${dayKey}T${open}`)
  const last = minutesOf(`${dayKey}T${close}`)
  if (first === null || last === null) return []
  const slots: DaySlot[] = []
  for (let from = first; from + minutes <= last; from += minutes) {
    const to = from + minutes
    if (from < now) continue
    const start = momentOf(from)
    const isBooked = busy.some((taken) => taken.from < to && from < taken.to)
    const isRequested = !isBooked && held.some((taken) => taken.from < to && from < taken.to)
    slots.push({ start, end: momentOf(to), label: start.slice(11), isBooked, isRequested })
  }
  return slots
}

/**
 * The week a picker opens on, from this one: 0 while a slot is still ahead this week by the
 * clock, else 1. Only time is read, so it costs no query; a fully booked week still opens.
 */
export function openingWeek(
  now: number,
  weekStart: WeekStart,
  days: Weekday[],
  hours: string,
  minutes: number,
): number {
  const today = momentOf(now).slice(0, 10)
  const first = weekStart === 'monday' ? 1 : 0
  const back = (WEEKDAYS.indexOf(weekdayOf(today)) - first + 7) % 7
  const midnight = minutesOf(today) ?? 0
  for (let ahead = 0; ahead < 7 - back; ahead++) {
    const day = momentOf(midnight + ahead * DAY_MINUTES).slice(0, 10)
    if (days.includes(weekdayOf(day)) && slotsOn(day, hours, minutes, [], now).length > 0) return 0
  }
  return 1
}

/** A booked slot in the reader's words: "Tue 3 Nov, 10:00". */
export function slotWords(slot: Slot, locale?: string): string {
  const day = new Date(`${slot.start.slice(0, 10)}T00:00:00Z`).toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
  return `${day}, ${slot.label}`
}

/** The reader's wall clock now, in the same minutes the slots count in. */
export function nowMinutes(at: Date = new Date()): number {
  const local = `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}T${pad(at.getHours())}:${pad(at.getMinutes())}`
  return minutesOf(local) ?? 0
}

/** A day whose last minute is behind the reader. */
export function isPast(dayKey: string, now: number): boolean {
  return (minutesOf(`${dayKey}T23:59`) ?? 0) < now
}

/** The day a slot sits on and the day after: the bounds a fresh look reads between. */
export function dayOf(slot: Slot): { day: string; next: string } {
  const day = slot.start.slice(0, 10)
  return { day, next: momentOf((minutesOf(day) ?? 0) + DAY_MINUTES).slice(0, 10) }
}

/** Whether anything in `rows` now overlaps the slot. */
export function isTaken(slot: Slot, rows: Row[], date: string, minutes: number): boolean {
  const from = minutesOf(slot.start) ?? 0
  const to = minutesOf(slot.end) ?? from
  return busyOf(rows, date, minutes).some((busy) => busy.from < to && from < busy.to)
}
