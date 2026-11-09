import { clockLabel, styled } from '../../lib'
import { usePaperHost } from '../../provider'
import { FormDialog } from '../form'
import { SLOT_HOURS, SLOT_MINUTES, type SlotsProps, useSlots } from './lib'
import { SlotsDays } from './slots-days'

/**
 * Free times to book, as Calendly and Fresha show them (D102, D134): a strip of the week's days —
 * those with nothing free faded — then the picked day's free times, the taken left out. With a
 * Show-as column (`show`, D133) only Open windows offer times. A press asks `add` in a modal, the
 * slot filled in, checked again as it is booked and said back. Through a link that takes
 * suggestions a press requests the slot, and a requested one is held; a read-only link books
 * nothing (D120).
 */
export function Slots({
  bind,
  date,
  minutes = SLOT_MINUTES,
  hours = SLOT_HOURS,
  days,
  show,
  allDay,
  add,
  addLabel = 'Book',
  empty = 'Nothing free',
  weekStart = 'monday',
  ...rest
}: SlotsProps) {
  const host = usePaperHost()
  const view = useSlots({ bind, date, minutes, hours, days, show, allDay, weekStart })
  const { period, booking, mode, picked } = view
  const verb = mode === 'suggest' ? 'Request' : addLabel
  const chosen = booking.picked
  const chosenDay = chosen && period.days.find((day) => chosen.start.startsWith(day.key))

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
        <SlotsDays
          view={view}
          isLoading={period.state.status === 'loading'}
          canBook={Boolean(add && mode)}
          empty={empty}
          locale={host.locale}
        />
      )}
      {add && mode && (
        <FormDialog
          open={chosen !== null}
          onClose={booking.close}
          isBooking
          title={`${verb}${chosenDay ? ` · ${chosenDay.long}` : ''}${chosen ? ` · ${clockLabel(chosen.label, host.locale)}` : ''}`}
          table={bind.table}
          fields={add}
          submit={addLabel}
          seed={chosen ? { [date]: `${chosen.start}/${chosen.end}` } : undefined}
          check={booking.check}
          onAdded={booking.landed}
        />
      )}
      {picked === null && period.state.status === 'ready' && (
        <p className="wsx-slots-none">{empty}</p>
      )}
    </div>
  )
}
