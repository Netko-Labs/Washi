import { WEEKDAY_NAMES } from './constants'
import { parseCron } from './parse'

const pad = (value: number) => String(value).padStart(2, '0')

/** The schedule in words where it has a plain shape; the expression itself where it does not. */
export function describeCron(expression: string): string {
  const fields = parseCron(expression)
  if (!fields) return expression
  const [minuteText, hourText, dom, month, dow] = expression.trim().split(/\s+/)
  const minutes = [...fields.minute]
  const hours = [...fields.hour]
  if (dom !== '*' || month !== '*') return expression

  if (hourText === '*' && minutes.length === 1) {
    return `Every hour at :${pad(minutes[0] ?? 0)}`
  }
  if (minuteText?.includes('/') || hourText?.includes('/')) return expression
  if (minutes.length !== 1 || hours.length !== 1) return expression

  const time = `${pad(hours[0] ?? 0)}:${pad(minutes[0] ?? 0)}`
  const days = [...fields.dayOfWeek].sort()
  if (dow === '*') return `Every day at ${time}`
  if (days.join() === '1,2,3,4,5') return `Every weekday at ${time}`
  if (days.join() === '0,6') return `Weekends at ${time}`
  const names = days.map((day) => WEEKDAY_NAMES[day] ?? '')
  return `Every ${names.join(', ')} at ${time}`
}
