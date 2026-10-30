import { DAY_MINUTES, NEXT_SEARCH_DAYS } from './constants'
import { matchesCron, matchesDay, parseCron } from './parse'
import { wallKey, wallMinus, wallMinute } from './wall'

/**
 * The latest minute at or before `now`, earlier today on its wall clock, that the schedule names —
 * as a wall key in its zone. A routine is due when it has not run since that key; a minute missed
 * yesterday is not caught up today.
 */
export function latestOccurrence(cron: string, timeZone: string, now: Date): string | null {
  const fields = parseCron(cron)
  if (!fields) return null
  const here = wallMinute(now, timeZone)
  for (let back = 0; back <= here.hour * 60 + here.minute; back++) {
    const at = wallMinus(here, back)
    if (matchesCron(fields, at)) return wallKey(at)
  }
  return null
}

/** The next minute after `now` the schedule names, read a day at a time; null if none ever comes. */
export function nextOccurrence(cron: string, timeZone: string, now: Date): string | null {
  const fields = parseCron(cron)
  if (!fields) return null
  const here = wallMinute(now, timeZone)
  const midnight = { ...here, hour: 0, minute: 0 }
  const hours = [...fields.hour].sort((a, b) => a - b)
  const minutes = [...fields.minute].sort((a, b) => a - b)
  for (let ahead = 0; ahead <= NEXT_SEARCH_DAYS; ahead++) {
    const day = wallMinus(midnight, -ahead * DAY_MINUTES)
    if (!matchesDay(fields, day)) continue
    for (const hour of hours) {
      for (const minute of minutes) {
        const isLater = ahead > 0 || hour * 60 + minute > here.hour * 60 + here.minute
        if (isLater) return wallKey({ ...day, hour, minute })
      }
    }
  }
  return null
}

/** A daily cron at that minute of the day — what a routine from before D68 meant. */
export function dailyCron(minuteOfDay: number): string {
  return `${minuteOfDay % 60} ${Math.floor(minuteOfDay / 60)} * * *`
}
