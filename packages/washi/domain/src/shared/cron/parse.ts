import { FIELD_NAMES, FIELD_RANGES } from './constants'
import type { CronFields, WallMinute } from './types'

function field(source: string, min: number, max: number): Set<number> | null {
  const values = new Set<number>()
  for (const part of source.split(',')) {
    const [range = '', stepText] = part.split('/')
    const step = stepText === undefined ? 1 : Number(stepText)
    if (!Number.isInteger(step) || step < 1) return null
    const [from, to] =
      range === '*'
        ? [min, max]
        : range.includes('-')
          ? range.split('-').map(Number)
          : [Number(range), stepText === undefined ? Number(range) : max]
    if (from === undefined || to === undefined) return null
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < min || to > max || from > to) {
      return null
    }
    for (let value = from; value <= to; value += step) values.add(value)
  }
  return values
}

/** Standard five-field cron (`*`, lists, ranges, steps); null when it does not parse. */
export function parseCron(expression: string): CronFields | null {
  const parts = expression.trim().split(/\s+/)
  if (parts.length !== 5) return null
  const sets = parts.map((part, index) => {
    const [min, max] = FIELD_RANGES[index] ?? [0, 0]
    return field(part, min, max)
  })
  const [minute, hour, dayOfMonth, month, dayOfWeek] = sets
  if (!minute || !hour || !dayOfMonth || !month || !dayOfWeek) return null
  if (dayOfWeek.delete(7)) dayOfWeek.add(0)
  return {
    minute,
    hour,
    dayOfMonth,
    month,
    dayOfWeek,
    isDayOfMonthAny: parts[2] === '*',
    isDayOfWeekAny: parts[4] === '*',
  }
}

export function isCron(expression: string): boolean {
  return parseCron(expression) !== null
}

/** Why an expression is not a schedule, in words; null when it is one. */
export function cronProblem(expression: string): string | null {
  const parts = expression.trim().split(/\s+/).filter(Boolean)
  if (parts.length !== 5) {
    return `A schedule has five fields (minute hour day month weekday); this has ${parts.length}.`
  }
  for (const [index, part] of parts.entries()) {
    const [min, max] = FIELD_RANGES[index] ?? [0, 0]
    if (!field(part, min, max)) return `${FIELD_NAMES[index]} “${part}” is not in ${min}–${max}.`
  }
  return null
}

/** The date alone: month, then day of month and weekday as cron ORs them. */
export function matchesDay(fields: CronFields, at: Omit<WallMinute, 'hour' | 'minute'>): boolean {
  if (!fields.month.has(at.month)) return false
  const byDate = fields.dayOfMonth.has(at.day)
  const byWeekday = fields.dayOfWeek.has(at.weekday)
  if (fields.isDayOfMonthAny) return byWeekday
  if (fields.isDayOfWeekAny) return byDate
  return byDate || byWeekday
}

export function matchesCron(fields: CronFields, at: WallMinute): boolean {
  return fields.minute.has(at.minute) && fields.hour.has(at.hour) && matchesDay(fields, at)
}
