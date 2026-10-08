/** "07:30" on this device's clock → minutes after UTC midnight. */
export function localToMinuteUtc(hhmm: string, today = new Date()): number {
  const [hours = 0, minutes = 0] = hhmm.split(':').map(Number)
  const local = new Date(today)
  local.setHours(hours, minutes, 0, 0)
  return local.getUTCHours() * 60 + local.getUTCMinutes()
}

/** Minutes after UTC midnight → this device's "07:30". */
export function minuteUtcToLocal(minuteUtc: number, today = new Date()): string {
  const utc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, minuteUtc),
  )
  return utc.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
