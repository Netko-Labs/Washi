import { type AgendaEventProps, badgeOf, eventTime, eventTitle, hueOf } from './lib'

export function AgendaEvent({ row, columns, onOpen, onMenu }: AgendaEventProps) {
  const id = typeof row.id === 'string' ? row.id : null
  const time = eventTime(row, columns)
  const badge = badgeOf(row, columns)
  const title = eventTitle(row, columns)
  const body = (
    <>
      {time && <span className="wsx-agenda-time">{time}</span>}
      <span className="wsx-agenda-title">{title}</span>
      {badge && <span className="wsx-agenda-badge">{badge}</span>}
    </>
  )
  const chip =
    id && onOpen ? (
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
  if (!id || !onMenu) return chip
  return (
    <div className="wsx-agenda-item">
      {chip}
      <button
        type="button"
        className="wsx-agenda-event-more"
        aria-haspopup="dialog"
        aria-label={`More for ${title}`}
        title="Duplicate, copy or repeat"
        onClick={() => onMenu(row)}
      >
        ⋯
      </button>
    </div>
  )
}
