import { MAX_LISTED, MONTH_NAMES, WEEKDAY_NAMES, WEEKDAY_SHORT } from './constants'
import { parseCron } from './parse'
import type { CronClock, CronDays, CronFields } from './types'

const STEP = /^\*\/(\d+)$/
const DAILY: CronDays = { at: (time) => `Every day at ${time}`, after: '' }
const pad = (value: number) => String(value).padStart(2, '0')
const sorted = (values: ReadonlySet<number>) => [...values].sort((a, b) => a - b)
const mondayFirst = (day: number) => (day + 6) % 7

function listOf(words: (string | number)[]): string {
  if (words.length < 2) return String(words[0] ?? '')
  return `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`
}

/** A step reads as a repeat only when it divides its field: `*\/7` minutes restarts each hour. */
function evenStep(text: string, span: number): number | null {
  const step = Number(STEP.exec(text)?.[1])
  return Number.isInteger(step) && span % step === 0 ? step : null
}

function clockOf(minuteText: string, hourText: string, fields: CronFields): CronClock | null {
  const minutes = sorted(fields.minute)
  const atMinute = minutes.length === 1 ? `:${pad(minutes[0] ?? 0)}` : null
  if (hourText === '*') {
    const step = minuteText === '*' ? 1 : evenStep(minuteText, 60)
    if (step === 1) return { kind: 'every', text: 'Every minute' }
    if (step) return { kind: 'every', text: `Every ${step} minutes` }
    return atMinute ? { kind: 'every', text: `Every hour at ${atMinute}` } : null
  }
  if (minuteText.includes('/') || minuteText === '*') return null
  const hourStep = evenStep(hourText, 24)
  if (hourStep && atMinute) {
    const every = hourStep === 1 ? 'Every hour' : `Every ${hourStep} hours`
    return { kind: 'every', text: `${every} at ${atMinute}` }
  }
  if (hourText.includes('/')) return null
  const hours = sorted(fields.hour)
  if (minutes.length * hours.length > MAX_LISTED) return null
  const times = hours.flatMap((hour) => minutes.map((minute) => `${pad(hour)}:${pad(minute)}`))
  return { kind: 'at', time: listOf(times) }
}

function weekDays(fields: CronFields): CronDays {
  const days = sorted(fields.dayOfWeek)
  if (days.length === 7) return DAILY
  if (days.join() === '1,2,3,4,5') {
    return { at: (time) => `Every weekday at ${time}`, after: ' on weekdays' }
  }
  if (days.join() === '0,6') return { at: (time) => `Weekends at ${time}`, after: ' on weekends' }
  if (days.length === 1) {
    const name = WEEKDAY_NAMES[days[0] ?? 0] ?? ''
    return { at: (time) => `Every ${name} at ${time}`, after: ` on ${name}s` }
  }
  const names = listOf(
    days.sort((a, b) => mondayFirst(a) - mondayFirst(b)).map((day) => WEEKDAY_SHORT[day] ?? ''),
  )
  return { at: (time) => `At ${time} on ${names}`, after: ` on ${names}` }
}

function calendarDays(fields: CronFields, domText: string, monthText: string): CronDays | null {
  if (domText.includes('/') || monthText.includes('/')) return null
  const days = sorted(fields.dayOfMonth)
  const months = sorted(fields.month).map((month) => MONTH_NAMES[month - 1] ?? '')
  if (months.length > MAX_LISTED && monthText !== '*') return null
  if (domText === '*') {
    const within = listOf(months)
    return { at: (time) => `Every day in ${within} at ${time}`, after: ` in ${within}` }
  }
  if (days.length > MAX_LISTED) return null
  const dayWords = days.length === 1 ? `day ${days[0]}` : `days ${listOf(days)}`
  const date =
    monthText === '*'
      ? `${dayWords} of every month`
      : days.length === 1 && months.length === 1
        ? `${days[0]} ${months[0]}`
        : `${dayWords} of ${listOf(months)}`
  return { at: (time) => `At ${time} on ${date}`, after: ` on ${date}` }
}

/** Cron ORs a restricted day of month with a restricted weekday; that shape stays an expression. */
function daysOf(fields: CronFields, dom: string, month: string, dow: string): CronDays | null {
  if (dow !== '*') return dom === '*' && month === '*' ? weekDays(fields) : null
  if (dom === '*' && month === '*') return DAILY
  return calendarDays(fields, dom, month)
}

/** The schedule in words where it has a plain shape; the expression itself where it does not. */
export function describeCron(expression: string): string {
  const fields = parseCron(expression)
  if (!fields) return expression
  const [minute = '', hour = '', dom = '', month = '', dow = ''] = expression.trim().split(/\s+/)
  const clock = clockOf(minute, hour, fields)
  const days = daysOf(fields, dom, month, dow)
  if (!clock || !days) return expression
  return clock.kind === 'at' ? days.at(clock.time) : `${clock.text}${days.after}`
}
