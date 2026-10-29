/** A bare calendar day, as a date column holds one. */
export const DAY = /^\d{4}-\d{2}-\d{2}$/

/** A bare day reads as "Oct 3" — a calendar day, never UTC midnight shifted into the reader's zone. */
export function dayLabel(value: string, locale?: string): string {
  if (!DAY.test(value)) return value
  return new Date(`${value}T00:00:00Z`).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

const MOMENT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/

function momentLabel(value: string, locale?: string): string {
  if (!MOMENT.test(value)) return dayLabel(value, locale)
  return new Date(`${value.slice(0, 16)}:00Z`).toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })
}

/**
 * A date cell in words — "Oct 3", "Oct 3, 10:00", or a `start/end` range as "Oct 3 – Oct 5" —
 * as written, never shifted between zones. Anything else is left as it is.
 */
export function whenLabel(value: string, locale?: string): string {
  const [start, end, ...rest] = value.split('/')
  if (!start || rest.length > 0 || !/^\d{4}-\d{2}-\d{2}/.test(start)) return value
  const from = momentLabel(start, locale)
  return end && /^\d{4}-\d{2}-\d{2}/.test(end) ? `${from} – ${momentLabel(end, locale)}` : from
}
