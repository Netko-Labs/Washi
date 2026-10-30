import { nextOccurrence, parseCron } from '@washi/domain'
import type {
  RoutineDraft,
  RoutineTemplate,
  RoutineWire,
  ScheduleDraft,
  ScheduleKind,
} from './types'

/** The zone this device lives in — what "07:00" means to the person typing it. */
export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

const pad = (value: number) => String(value).padStart(2, '0')

/** The form's schedule as cron. Custom is taken as typed; the server checks it. */
export function cronFromSchedule(schedule: ScheduleDraft): string {
  const [hours = 0, minutes = 0] = schedule.time.split(':').map(Number)
  switch (schedule.kind) {
    case 'daily':
      return `${minutes} ${hours} * * *`
    case 'weekdays':
      return `${minutes} ${hours} * * 1-5`
    case 'weekly':
      return `${minutes} ${hours} * * ${[...schedule.days].sort().join(',') || '1'}`
    case 'hourly':
      return `${minutes} * * * *`
    case 'custom':
      return schedule.cron.trim()
  }
}

/** The plainest preset a cron is; anything else is custom. */
export function scheduleFromCron(cron: string, timeZone: string): ScheduleDraft {
  const fields = parseCron(cron)
  const [minuteText, hourText, dom, month, dow] = cron.trim().split(/\s+/)
  const custom: ScheduleDraft = { kind: 'custom', time: '09:00', days: [1], cron, timeZone }
  if (!fields || dom !== '*' || month !== '*') return custom
  const minutes = [...fields.minute]
  const hours = [...fields.hour]
  if (minutes.length !== 1 || minuteText?.includes('/')) return custom
  const minute = minutes[0] ?? 0
  if (hourText === '*') {
    return { ...custom, kind: dow === '*' ? 'hourly' : 'custom', time: `00:${pad(minute)}` }
  }
  if (hours.length !== 1 || hourText?.includes('/')) return custom
  const time = `${pad(hours[0] ?? 0)}:${pad(minute)}`
  const days = [...fields.dayOfWeek].sort()
  const kind: ScheduleKind =
    dow === '*' ? 'daily' : days.join() === '1,2,3,4,5' ? 'weekdays' : 'weekly'
  return { kind, time, days, cron, timeZone }
}

export function draftFrom(
  source: { title: string; prompt: string; cron: string; timeZone: string } | null,
  template: RoutineTemplate | undefined,
): RoutineDraft {
  const from = source ?? template
  const cron = from?.cron ?? '0 9 * * 1-5'
  const timeZone = source?.timeZone ?? deviceTimeZone()
  return {
    title: from?.title ?? '',
    prompt: from?.prompt ?? '',
    schedule: scheduleFromCron(cron, timeZone),
  }
}

/** `2026-10-12T09:00` → "Mon 12 Oct, 09:00". */
export function wallLabel(key: string): string {
  const [date = '', time = ''] = key.split('T')
  const day = new Date(`${date}T00:00:00Z`)
  const label = day.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(day.getUTCFullYear() !== new Date().getFullYear() && { year: 'numeric' }),
    timeZone: 'UTC',
  })
  return `${label}, ${time}`
}

/** A routine with no runs yet: paused, when it would run resumed; else when it runs next. */
export function noRunsNote(
  routine: Pick<RoutineWire, 'cron' | 'timeZone' | 'enabled'> | null,
  now: Date,
): string {
  const next = routine ? nextOccurrence(routine.cron, routine.timeZone, now) : null
  const when = next ? wallLabel(next) : null
  if (routine && !routine.enabled) {
    return when
      ? `No runs yet. It is paused: resume it and it runs next on ${when}, or run it now.`
      : 'No runs yet. It is paused: run it now, or resume it.'
  }
  return when ? `No runs yet. It runs next on ${when}, or run it now.` : 'No runs yet. Run it now.'
}

export function durationLabel(ms: number | null): string {
  if (ms === null) return '—'
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

/** An HLC string leads with 14 digits of wall-clock milliseconds. */
export function startedAtMs(hlc: string): number {
  return Number(hlc.slice(0, 14))
}
