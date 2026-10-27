import { matchesCron, parseCron } from './parse'
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

/** The next minute after `now` the schedule names, within a week; null past that. */
export function nextOccurrence(cron: string, timeZone: string, now: Date): string | null {
  const fields = parseCron(cron)
  if (!fields) return null
  const here = wallMinute(now, timeZone)
  for (let ahead = 1; ahead <= 7 * 24 * 60; ahead++) {
    const at = wallMinus(here, -ahead)
    if (matchesCron(fields, at)) return wallKey(at)
  }
  return null
}

/** A daily cron at that minute of the day — what a routine from before D68 meant. */
export function dailyCron(minuteOfDay: number): string {
  return `${minuteOfDay % 60} ${Math.floor(minuteOfDay / 60)} * * *`
}
