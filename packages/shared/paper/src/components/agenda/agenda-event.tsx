import { clockLabel } from '../../lib'
import { type AgendaEventProps, badgeOf, eventTimeOn, eventTitle, hueOf } from './lib'

/** "10:00 AM–11:00 AM" the reader's way; a time column holding words keeps them. */
function shownTime(time: string | null, locale?: string): string | null {
  if (!time) return null
  return time.replace(/\b\d{2}:\d{2}\b/g, (part) => clockLabel(part, locale))
}

/** One event on its day; a press opens its card — the one place an event is read and changed. */
export function AgendaEvent({ row, columns, day, locale, onPress }: AgendaEventProps) {
  const time = shownTime(eventTimeOn(row, columns, day), locale)
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
