import type { Row } from '../../lib'
import { AgendaEvent } from './agenda-event'
import type { AgendaDayProps } from './lib'

export function AgendaDay({
  day,
  rows,
  columns,
  empty,
  limit,
  onAdd,
  onOpen,
  onMenu,
}: AgendaDayProps) {
  const shown = limit === undefined ? rows : rows.slice(0, limit)
  const folded = rows.slice(shown.length)
  const event = (row: Row, index: number) => (
    <AgendaEvent
      key={String(row.id ?? index)}
      row={row}
      columns={columns}
      onOpen={onOpen}
      onMenu={onMenu}
    />
  )

  return (
    <section
      className="wsx-agenda-day"
      aria-label={day.long}
      data-today={day.isToday || undefined}
      data-outside={day.isOutside || undefined}
      data-empty={rows.length === 0 || undefined}
    >
      <header className="wsx-agenda-day-head">
        <span className="wsx-agenda-weekday">{day.weekday}</span>
        <span className="wsx-agenda-date">{day.day}</span>
        {onAdd && (
          <button
            type="button"
            className="wsx-agenda-add"
            aria-label={`Add on ${day.long}`}
            title={`Add on ${day.long}`}
            onClick={onAdd}
          >
            +
          </button>
        )}
      </header>
      <div className="wsx-agenda-events">
        {rows.length > 0 ? shown.map(event) : <span className="wsx-agenda-free">{empty}</span>}
        {folded.length > 0 && (
          <details className="wsx-agenda-more">
            <summary>+{folded.length} more</summary>
            {folded.map(event)}
          </details>
        )}
      </div>
    </section>
  )
}
