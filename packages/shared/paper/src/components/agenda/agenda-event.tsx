import { clockLabel } from '../../lib'
import { type AgendaEventProps, badgeOf, eventTime, eventTitle, hueOf } from './lib'

/** "10:00 AM–11:00 AM" the reader's way; a time column holding words keeps them. */
function shownTime(time: string | null, locale?: string): string | null {
  if (!time) return null
  return time
    .split('–')
    .map((part) => (/^\d{2}:\d{2}$/.test(part) ? clockLabel(part, locale) : part))
    .join('–')
}

/** One event on its day; a press opens its card — the one place an event is read and changed. */
export function AgendaEvent({ row, columns, locale, onPress }: AgendaEventProps) {
  const time = shownTime(eventTime(row, columns), locale)
  const badge = badgeOf(row, columns)
  const title = eventTitle(row, columns)
  const body = (
    <>
      {time && <span className="wsx-agenda-time">{time}</span>}
      <span className="wsx-agenda-title">{title}</span>
      {badge && <span className="wsx-agenda-badge">{badge}</span>}
    </>
  )
  if (!onPress) {
    return (
      <div className="wsx-agenda-event" data-hue={hueOf(badge)}>
        {body}
      </div>
    )
  }
  return (
    <button
      type="button"
      className="wsx-agenda-event"
      data-hue={hueOf(badge)}
      aria-haspopup="dialog"
      onClick={() => onPress(row)}
    >
      {body}
    </button>
  )
}
