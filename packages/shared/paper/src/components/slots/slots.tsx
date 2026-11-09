import { addModeOf, clockLabel, styled } from '../../lib'
import { usePaperHost } from '../../provider'
import { isOpenCell } from '../../registry'
import { useAgendaPeriod } from '../agenda'
import { FormDialog } from '../form'
import {
  busyOf,
  EVERY_WEEKDAY,
  isPast,
  nowMinutes,
  openingWeek,
  SLOT_DAYS,
  SLOT_HOURS,
  SLOT_MINUTES,
  type SlotsProps,
  slotsOn,
  useSlotBooking,
  weekdayOf,
  windowSlotsOn,
} from './lib'

/**
 * A week of free times to book, Calendly's way (D102): the hours of each allowed day cut into
 * slots, the booked struck through, the past left out; a week already spent opens on the next.
 * A press asks `add` in a modal, the slot filled in, checked again as it is booked and said back.
 * Through a link that takes suggestions a press requests the slot, and a requested one is held;
 * a read-only link books nothing (D120).
 */
export function Slots({
  bind,
  date,
  minutes = SLOT_MINUTES,
  hours = SLOT_HOURS,
  days: daysAsked,
  show,
  add,
  addLabel = 'Book',
  empty = 'Nothing free',
  weekStart = 'monday',
  ...rest
}: SlotsProps) {
  const host = usePaperHost()
  const now = nowMinutes()
  const days = daysAsked ?? (show ? EVERY_WEEKDAY : SLOT_DAYS)
  const period = useAgendaPeriod({
    bind,
    date,
    weekStart,
    view: 'week',
    locale: host.locale,
    // Open windows are rows: whether this week still has one is only known once they are read.
    startOffset: show ? 0 : openingWeek(now, weekStart, days, hours, minutes),
  })
  const mode = addModeOf(host)
  const booking = useSlotBooking(bind, date, minutes, mode === 'suggest', show)
  const { picked } = booking
  const rows = period.state.rows
  // With a Show-as column, Open rows are where to book and everything else takes time (D133).
  const windows = show
    ? busyOf(
        rows.filter((row) => isOpenCell(row[show])),
        date,
        minutes,
      )
    : null
  const busy = busyOf(show ? rows.filter((row) => !isOpenCell(row[show])) : rows, date, minutes)
  const held = busyOf(
    period.requested.map((cell) => ({ [date]: cell })),
    date,
    minutes,
  )
  const verb = mode === 'suggest' ? 'Request' : addLabel
  const open = period.days.filter((day) => days.includes(weekdayOf(day.key)))
  const pickedDay = picked && period.days.find((day) => picked.start.startsWith(day.key))

  return (
    <div {...styled(rest, 'wsx-slots')}>
      <div className="wsx-agenda-bar">
        <span className="wsx-agenda-range">{period.label}</span>
        <div className="wsx-agenda-nav">
          <button type="button" aria-label="Previous week" onClick={() => period.shift(-1)}>
            ‹
          </button>
          <button type="button" disabled={period.isCurrent} onClick={period.reset}>
            Today
          </button>
          <button type="button" aria-label="Next week" onClick={() => period.shift(1)}>
            ›
          </button>
        </div>
      </div>
      {booking.booked && (
        <p className="wsx-slots-booked" role="status">
          {booking.booked}
        </p>
      )}
      {period.state.status === 'error' ? (
        <div className="wsx-empty" data-state="error" role="alert">
          This week could not load — {period.state.error}
        </div>
      ) : (
        <div className="wsx-slots-days" aria-busy={period.state.status === 'loading' || undefined}>
          {open.map((day) => {
            const slots =
              period.state.status === 'ready'
                ? windows
                  ? windowSlotsOn(day.key, windows, minutes, busy, now, held)
                  : slotsOn(day.key, hours, minutes, busy, now, held)
                : []
            return (
              <section
                key={day.key}
                className="wsx-slots-day"
                data-today={day.isToday || undefined}
              >
                <h4 className="wsx-slots-head">
                  <span>{day.weekday}</span> {day.day}
                </h4>
                {slots.length > 0 ? (
                  <div className="wsx-slots-list">
                    {slots.map((slot) => (
                      <button
                        key={slot.start}
                        type="button"
                        className="wsx-slot"
                        data-booked={slot.isBooked || undefined}
                        data-requested={slot.isRequested || undefined}
                        aria-label={
                          slot.isBooked
                            ? `${clockLabel(slot.label, host.locale)}, booked`
                            : slot.isRequested
                              ? `${clockLabel(slot.label, host.locale)}, requested`
                              : undefined
                        }
                        disabled={!add || !mode || slot.isBooked || slot.isRequested}
                        onClick={() => booking.pick(slot)}
                      >
                        {slot.isRequested ? (
                          <>
                            <span className="wsx-slot-time">
                              {clockLabel(slot.label, host.locale)}
                            </span>
                            <span className="wsx-slot-note">Requested</span>
                          </>
                        ) : (
                          clockLabel(slot.label, host.locale)
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="wsx-slots-none">
                    {period.state.status !== 'ready' ? '…' : isPast(day.key, now) ? 'Past' : empty}
                  </p>
                )}
              </section>
            )
          })}
        </div>
      )}
      {add && mode && (
        <FormDialog
          open={picked !== null}
          onClose={booking.close}
          isBooking
          title={`${verb}${pickedDay ? ` · ${pickedDay.long}` : ''}${picked ? ` · ${picked.label}` : ''}`}
          table={bind.table}
          fields={add}
          submit={addLabel}
          seed={picked ? { [date]: `${picked.start}/${picked.end}` } : undefined}
          check={booking.check}
          onAdded={booking.landed}
        />
      )}
    </div>
  )
}
