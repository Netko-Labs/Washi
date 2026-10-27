import { type AgendaEventProps, badgeOf, eventTime, eventTitle, hueOf } from './lib'

export function AgendaEvent({ row, columns, onOpen }: AgendaEventProps) {
  const id = typeof row.id === 'string' ? row.id : null
  const time = eventTime(row, columns)
  const badge = badgeOf(row, columns)
  const body = (
    <>
      {time && <span className="wsx-agenda-time">{time}</span>}
      <span className="wsx-agenda-title">{eventTitle(row, columns)}</span>
      {badge && <span className="wsx-agenda-badge">{badge}</span>}
    </>
  )
  return id && onOpen ? (
    <button
      type="button"
      className="wsx-agenda-event"
      data-hue={hueOf(badge)}
      onClick={() => onOpen(id)}
    >
      {body}
    </button>
  ) : (
    <div className="wsx-agenda-event" data-hue={hueOf(badge)}>
      {body}
    </div>
  )
}
