import type { ClockChoice, When } from './types'

const DAY = /^\d{4}-\d{2}-\d{2}$/
const PART = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2}))?/

/** Minutes between two choices in an hours list. */
export const CLOCK_STEP = 15
/** Where a time starts when one is added to a whole day. */
export const FIRST_HOUR = '09:00'
/** How long a time lasts when it is added without an end. */
export const DEFAULT_MINUTES = 60

const pad = (value: number) => String(value).padStart(2, '0')

/** A cell's parts — `2026-11-09T10:00/2026-11-09T11:00` is a day, 10:00 and 11:00 that day. */
export function readWhen(cell: unknown): When {
  const [start = '', end = ''] = typeof cell === 'string' ? cell.split('/') : []
  const from = PART.exec(start)
  const to = PART.exec(end)
  return {
    day: from?.[1] ?? '',
    time: from?.[2] ? `${from[2]}:${from[3]}` : null,
    endDay: to?.[1] ?? null,
    endTime: to?.[2] ? `${to[2]}:${to[3]}` : null,
  }
}

/** The parts back as a cell; no day is no value. A time never ends before it starts. */
export function writeWhen(when: When): string | null {
  if (!DAY.test(when.day)) return null
  const start = when.time ? `${when.day}T${when.time}` : when.day
  const endDay = when.endDay ?? (when.endTime ? when.day : null)
  if (!endDay) return start
  const end = when.time && when.endTime ? `${endDay}T${when.endTime}` : endDay
  if (end <= start) return start
  return `${start}/${end}`
}

/** `HH:MM` as minutes past midnight, or null. */
export function minutesOf(time: string | null): number | null {
  const match = time ? /^(\d{2}):(\d{2})$/.exec(time) : null
  return match ? Number(match[1]) * 60 + Number(match[2]) : null
}

/** A day and time moved by `minutes`, the day following past midnight. */
export function shiftClock(day: string, time: string, minutes: number) {
  const [year, month, date] = day.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const at = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, date ?? 1, hour ?? 0, minute ?? 0))
  at.setUTCMinutes(at.getUTCMinutes() + minutes)
  return {
    day: `${String(at.getUTCFullYear()).padStart(4, '0')}-${pad(at.getUTCMonth() + 1)}-${pad(at.getUTCDate())}`,
    time: `${pad(at.getUTCHours())}:${pad(at.getUTCMinutes())}`,
  }
}

/** How long a timed span lasts, in minutes; null for a whole day or one without an end. */
export function spanMinutes(when: When): number | null {
  if (!when.time || !when.endTime) return null
  const from = Date.parse(`${when.day}T${when.time}:00Z`)
  const to = Date.parse(`${when.endDay ?? when.day}T${when.endTime}:00Z`)
  return Number.isNaN(from) || Number.isNaN(to) ? null : Math.round((to - from) / 60_000)
}

/** A time added to a whole day: 09:00 for an hour, unless it already had a time to keep. */
export function withTime(when: When): When {
  if (when.time) return when
  const time = FIRST_HOUR
  const end = shiftClock(when.day, time, DEFAULT_MINUTES)
  return { day: when.day, time, endDay: null, endTime: end.time }
}

/** Back to a whole day: the times go, a later end day stays. */
export function withoutTime(when: When): When {
  const endDay = when.endDay && when.endDay > when.day ? when.endDay : null
  return { day: when.day, time: null, endDay, endTime: null }
}

/** A new start keeps how long it lasted, as a calendar moves an event: the end follows. */
export function withStart(when: When, time: string): When {
  const length = spanMinutes(when)
  if (length === null || length <= 0) {
    const end = shiftClock(when.day, time, DEFAULT_MINUTES)
    return { ...when, time, endDay: end.day === when.day ? null : end.day, endTime: end.time }
  }
  const end = shiftClock(when.day, time, length)
  return { ...when, time, endDay: end.day === when.day ? null : end.day, endTime: end.time }
}

/** A new day carries the whole span with it: its times and how many days it ran. */
export function withDay(when: When, day: string): When {
  if (!DAY.test(day)) return { ...when, day }
  if (!when.endDay || !DAY.test(when.day)) return { ...when, day }
  const gap = Math.round((Date.parse(when.endDay) - Date.parse(when.day)) / 86_400_000)
  const end = shiftClock(day, '00:00', gap * 24 * 60).day
  return { ...when, day, endDay: end === day && when.time ? null : end }
}

/** "15 min", "1 hr", "1 hr 30 min", "2 hrs". */
export function durationWords(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  const head = `${hours} hr${hours === 1 || rest > 0 ? '' : 's'}`
  return rest > 0 ? `${head} ${rest} min` : head
}

const formats = new Map<string, Intl.DateTimeFormat>()

/** One formatter per locale: an hours list reads 96 times a draw. */
function clockFormat(locale?: string): Intl.DateTimeFormat {
  const key = locale ?? ''
  const known = formats.get(key)
  if (known) return known
  const { hourCycle } = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    timeZone: 'UTC',
  }).resolvedOptions()
  // A 24-hour clock reads 09:00, as a timetable does; a 12-hour one 9:00 AM.
  const isDay = hourCycle === 'h23' || hourCycle === 'h24'
  const format = new Intl.DateTimeFormat(locale, {
    hour: isDay ? '2-digit' : 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  })
  formats.set(key, format)
  return format
}

/** `14:30` the reader's way — "2:30 PM", "14:30" — read as written, never shifted between zones. */
export function clockLabel(time: string, locale?: string): string {
  const minutes = minutesOf(time)
  if (minutes === null) return time
  return clockFormat(locale).format(new Date(Date.UTC(1970, 0, 1, 0, minutes)))
}

/**
 * A day's hours every `CLOCK_STEP` minutes, the way they read. With `from`, an end's list: only
 * the times after it, each saying how long that makes it. A value off the grid is kept in place.
 */
export function clockChoices(
  locale?: string,
  from?: string | null,
  keep?: string | null,
): ClockChoice[] {
  const start = minutesOf(from ?? null)
  const times = new Set<string>()
  for (let at = 0; at < 24 * 60; at += CLOCK_STEP)
    times.add(`${pad(Math.floor(at / 60))}:${pad(at % 60)}`)
  if (keep && minutesOf(keep) !== null) times.add(keep)
  return [...times]
    .sort()
    .filter((time) => start === null || (minutesOf(time) ?? 0) > start)
    .map((time) => {
      const label = clockLabel(time, locale)
      if (start === null) return { value: time, label }
      return { value: time, label: `${label} (${durationWords((minutesOf(time) ?? 0) - start)})` }
    })
}

/** "10:00 – 11:30" the reader's way, a whole day reading nothing. */
export function clockSpan(when: When, locale?: string): string | null {
  if (!when.time) return null
  const from = clockLabel(when.time, locale)
  return when.endTime ? `${from} – ${clockLabel(when.endTime, locale)}` : from
}
