import { useState } from 'react'
import { styled } from '../../lib'
import { usePaperHost } from '../../provider'
import { useAgendaPeriod } from '../agenda'
import { FormDialog } from '../form'
import {
  busyOf,
  isPast,
  nowMinutes,
  SLOT_DAYS,
  SLOT_HOURS,
  SLOT_MINUTES,
  type Slot,
  type SlotsProps,
  slotsOn,
  weekdayOf,
} from './lib'

/**
 * A week of free times to book, Calendly's way (D102): the hours of each allowed day cut into
 * slots, minus what is booked or past. A press asks `add` in a modal, the slot already filled in.
 */
export function Slots({
  bind,
  date,
  minutes = SLOT_MINUTES,
  hours = SLOT_HOURS,
  days = SLOT_DAYS,
  add,
  addLabel = 'Book',
  empty = 'Nothing free',
  weekStart = 'monday',
  ...rest
}: SlotsProps) {
  const host = usePaperHost()
  const period = useAgendaPeriod({ bind, date, weekStart, view: 'week', locale: host.locale })
  const [picked, setPicked] = useState<Slot | null>(null)
  const busy = busyOf(period.state.rows, date, minutes)
  const now = nowMinutes()
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
      {period.state.status === 'error' ? (
        <div className="wsx-empty" data-state="error" role="alert">
          This week could not load — {period.state.error}
        </div>
      ) : (
        <div className="wsx-slots-days" aria-busy={period.state.status === 'loading' || undefined}>
          {open.map((day) => {
            const slots =
              period.state.status === 'ready' ? slotsOn(day.key, hours, minutes, busy, now) : []
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
                        disabled={!add}
                        onClick={() => setPicked(slot)}
                      >
                        {slot.label}
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
      {add && (
        <FormDialog
          open={picked !== null}
          onClose={() => setPicked(null)}
          title={`${addLabel}${pickedDay ? ` · ${pickedDay.long}` : ''}${picked ? ` · ${picked.label}` : ''}`}
          table={bind.table}
          fields={add}
          submit={addLabel}
          seed={picked ? { [date]: `${picked.start}/${picked.end}` } : undefined}
        />
      )}
    </div>
  )
}
