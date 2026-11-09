import { clockLabel } from '../../lib'
import type { SlotsDaysProps } from './lib'

/**
 * The week's days as a strip — each its weekday, its date and how many times are free, a day with
 * none faded — over the picked day's free times. A requested time stays on, held and said so; a
 * booked one is left out, as a booking page shows only what can be booked.
 */
export function SlotsDays({ view, isLoading, canBook, empty, locale }: SlotsDaysProps) {
  const { daySlots, picked, pick, booking } = view
  if (!picked) return null
  const shown = picked.slots.filter((slot) => !slot.isBooked)

  return (
    <div className="wsx-slots-pick" aria-busy={isLoading || undefined}>
      <div className="wsx-slots-strip" role="tablist" aria-label="Day">
        {daySlots.map(({ day, free, isPast }) => (
          <button
            key={day.key}
            type="button"
            role="tab"
            className="wsx-slots-daybtn"
            aria-selected={day.key === picked.day.key}
            aria-label={`${day.long}, ${free.length === 0 ? 'nothing free' : `${free.length} free`}`}
            data-today={day.isToday || undefined}
            data-none={free.length === 0 || undefined}
            onClick={() => pick(day.key)}
          >
            <span className="wsx-slots-weekday">{day.weekday}</span>
            <span className="wsx-slots-date">{day.day}</span>
            <span className="wsx-slots-count">
              {isLoading ? '…' : free.length > 0 ? `${free.length} free` : isPast ? 'Past' : '—'}
            </span>
          </button>
        ))}
      </div>
      <div className="wsx-slots-panel" role="tabpanel" aria-label={picked.day.long}>
        <p className="wsx-slots-when">
          {picked.day.long}
          {picked.free.length > 0 && (
            <span>
              {' '}
              · {picked.free.length} {picked.free.length === 1 ? 'time' : 'times'}
            </span>
          )}
        </p>
        {shown.length > 0 ? (
          <div className="wsx-slots-list">
            {shown.map((slot) => (
              <button
                key={slot.start}
                type="button"
                className="wsx-slot"
                data-requested={slot.isRequested || undefined}
                aria-label={
                  slot.isRequested ? `${clockLabel(slot.label, locale)}, requested` : undefined
                }
                disabled={!canBook || slot.isRequested}
                onClick={() => booking.pick(slot)}
              >
                {slot.isRequested ? (
                  <>
                    <span className="wsx-slot-time">{clockLabel(slot.label, locale)}</span>
                    <span className="wsx-slot-note">Requested</span>
                  </>
                ) : (
                  clockLabel(slot.label, locale)
                )}
              </button>
            ))}
          </div>
        ) : (
          <p className="wsx-slots-none">{isLoading ? '…' : picked.isPast ? 'Past' : empty}</p>
        )}
      </div>
    </div>
  )
}
