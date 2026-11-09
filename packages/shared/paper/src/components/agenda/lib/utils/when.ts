import type { Cell } from '@washi/ink'
import { clockLabel, clockSpan, readWhen, writeWhen } from '../../../../lib'
import type { AgendaColumns, EventPatch, Row, When } from '../types'

const DAY_KEY = /^(\d{4}-\d{2}-\d{2})/
const CLOCK = /(\d{2}):(\d{2})/

/** A time column's `09:00`, or the time a whole moment holds; anything else is no time. */
function clockOf(value: Cell | undefined): string | null {
  if (typeof value !== 'string') return null
  const match = CLOCK.exec(value.includes('T') ? (value.split('T')[1] ?? '') : value)
  return match ? `${match[1]}:${match[2]}` : null
}

/**
 * The event's day and hours, wherever the agenda keeps them: in its date (`10:00/11:00` as a
 * range), or in time columns of its own beside a bare day.
 */
export function eventWhen(row: Row, columns: AgendaColumns): When {
  if (!columns.time) return readWhen(row[columns.date])
  const day = DAY_KEY.exec(String(row[columns.date] ?? ''))?.[1] ?? ''
  return {
    day,
    time: clockOf(row[columns.time] as Cell),
    endDay: null,
    endTime: columns.end ? clockOf(row[columns.end] as Cell) : null,
  }
}

/** What a changed time writes back: the date alone, or the date and its own time columns. */
export function eventPatch(when: When, columns: AgendaColumns): EventPatch {
  if (!columns.time) return { [columns.date]: writeWhen(when) }
  return {
    [columns.date]: when.day || null,
    [columns.time]: when.time,
    ...(columns.end && { [columns.end]: when.time ? when.endTime : null }),
  }
}

const longDay = (day: string, locale?: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })

/** "Tuesday, November 10 · 10:00 AM – 11:00 AM"; a span of days names both. */
export function eventWhenWords(when: When, locale?: string): string {
  if (!DAY_KEY.test(when.day)) return ''
  const day = longDay(when.day, locale)
  const hours = clockSpan(when, locale)
  if (when.endDay && when.endDay > when.day) {
    const last = longDay(when.endDay, locale)
    if (!when.time) return `${day} – ${last}`
    const ends = when.endTime ? `, ${clockLabel(when.endTime, locale)}` : ''
    return `${day}, ${clockLabel(when.time, locale)} – ${last}${ends}`
  }
  return hours ? `${day} · ${hours}` : day
}
