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
/** A whole day or moment, nothing after it: `2026-10-31T10:00 kickoff` is text, not a date. */
const WHEN = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/

/** Intl writes year 1 as "1"; a date column means `0001`. */
function formatUtc(date: Date, locale: string | undefined, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' })
    .formatToParts(date)
    .map((part) => (part.type === 'year' ? part.value.padStart(4, '0') : part.value))
    .join('')
}

function momentLabel(value: string, thisYear: number, locale?: string): string {
  const day: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    ...(Number(value.slice(0, 4)) !== thisYear && { year: 'numeric' }),
  }
  if (!MOMENT.test(value)) return formatUtc(new Date(`${value}T00:00:00Z`), locale, day)
  return formatUtc(new Date(`${value.slice(0, 16)}:00Z`), locale, {
    ...day,
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * A date cell in words — "Oct 3", "Oct 3, 10:00", or a `start/end` range as "Oct 3 – Oct 5" —
 * as written, never shifted between zones; a year other than the reader's is spelled out.
 * Anything else is left as it is.
 */
export function whenLabel(value: string, locale?: string, now = new Date()): string {
  const [start, end, ...rest] = value.split('/')
  if (!start || rest.length > 0 || !WHEN.test(start) || (end !== undefined && !WHEN.test(end))) {
    return value
  }
  const thisYear = now.getFullYear()
  const from = momentLabel(start, thisYear, locale)
  return end ? `${from} – ${momentLabel(end, thisYear, locale)}` : from
}
