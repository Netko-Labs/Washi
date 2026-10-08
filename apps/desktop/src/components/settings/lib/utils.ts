/** "07:30" → minutes after midnight. The zone travels separately. */
export function toMinuteOfDay(hhmm: string): number {
  const [hours = 0, minutes = 0] = hhmm.split(':').map(Number)
  return hours * 60 + minutes
}

/** The zone this device lives in — what "07:00" means to the person typing it. */
export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/** "07:00", plus the zone when it is not this device's: a routine keeps its own clock. */
export function routineTime(minuteOfDay: number, timeZone: string): string {
  const hhmm = `${String(Math.floor(minuteOfDay / 60)).padStart(2, '0')}:${String(minuteOfDay % 60).padStart(2, '0')}`
  return timeZone === deviceTimeZone() ? hhmm : `${hhmm} ${timeZone}`
}
