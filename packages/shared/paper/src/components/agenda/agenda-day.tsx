import { AgendaEvent } from './agenda-event'
import type { AgendaDayProps } from './lib'

export function AgendaDay({ day, rows, columns, empty, onAdd, onOpen }: AgendaDayProps) {
  return (
    <section
      className="wsx-agenda-day"
      aria-label={day.long}
      data-today={day.isToday || undefined}
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
        {rows.length > 0 ? (
          rows.map((row, index) => (
            <AgendaEvent
              key={String(row.id ?? index)}
              row={row}
              columns={columns}
              onOpen={onOpen}
            />
          ))
        ) : (
          <span className="wsx-agenda-free">{empty}</span>
        )}
      </div>
    </section>
  )
}
