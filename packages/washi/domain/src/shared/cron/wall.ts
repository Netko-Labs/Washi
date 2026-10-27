import type { WallMinute } from './types'

/** The wall clock in a zone at `now`. */
export function wallMinute(now: Date, timeZone: string): WallMinute {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      weekday: 'short',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  )
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday ?? '')
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday,
  }
}

/** `YYYY-MM-DDTHH:MM` — sortable, so "ran since" is a string comparison. */
export function wallKey(at: WallMinute): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${at.year}-${pad(at.month)}-${pad(at.day)}T${pad(at.hour)}:${pad(at.minute)}`
}

/** `minutes` earlier on the same wall clock — calendar arithmetic, deaf to daylight saving. */
export function wallMinus(at: WallMinute, minutes: number): WallMinute {
  const moment = new Date(Date.UTC(at.year, at.month - 1, at.day, at.hour, at.minute - minutes))
  return {
    year: moment.getUTCFullYear(),
    month: moment.getUTCMonth() + 1,
    day: moment.getUTCDate(),
    hour: moment.getUTCHours(),
    minute: moment.getUTCMinutes(),
    weekday: moment.getUTCDay(),
  }
}
