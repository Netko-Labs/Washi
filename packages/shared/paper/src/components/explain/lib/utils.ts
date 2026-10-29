import { HOUR, HOURS_UNDER, MINUTE } from './constants'
import type { CountdownView } from './types'

/** `2026-12-24` or `2026-12-24T18:00` as a moment on the reader's own clock. */
export function wallMoment(to: string): Date {
  const [year = 0, month = 1, day = 1] = to.slice(0, 10).split('-').map(Number)
  const [hour = 0, minute = 0] = to.length > 10 ? to.slice(11, 16).split(':').map(Number) : []
  return new Date(year, month - 1, day, hour, minute)
}

function midnight(moment: Date): number {
  return new Date(moment.getFullYear(), moment.getMonth(), moment.getDate()).getTime()
}

/** Whole calendar days from `now` to `then`; a DST day is still one day. */
export function daysBetween(now: Date, then: Date): number {
  return Math.round((midnight(then) - midnight(now)) / (24 * HOUR))
}

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many
}

export function countdownOf(to: string, now: number): CountdownView {
  const target = wallMoment(to)
  const left = target.getTime() - now
  if (to.length > 10 && left > 0 && left < HOURS_UNDER) {
    const hours = Math.floor(left / HOUR)
    if (hours >= 1)
      return { when: 'ahead', figure: String(hours), unit: plural(hours, 'hour', 'hours') }
    const minutes = Math.max(1, Math.ceil(left / MINUTE))
    return { when: 'ahead', figure: String(minutes), unit: plural(minutes, 'minute', 'minutes') }
  }
  const days = daysBetween(new Date(now), target)
  if (days > 0) return { when: 'ahead', figure: String(days), unit: plural(days, 'day', 'days') }
  if (days === 0) return { when: 'today', figure: 'Today', unit: '' }
  return { when: 'past', figure: String(-days), unit: plural(-days, 'day ago', 'days ago') }
}
