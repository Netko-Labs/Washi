import { useState } from 'react'
import { addModeOf } from '../../../../lib'
import { usePaperHost } from '../../../../provider'
import { isOpenCell, takesTime } from '../../../../registry'
import { useAgendaPeriod } from '../../../agenda'
import { EVERY_WEEKDAY, SLOT_DAYS } from '../constants'
import type { SlotsView, SlotsViewOptions } from '../types'
import {
  busyOf,
  isPast,
  nowMinutes,
  openingWeek,
  slotsOn,
  weekdayOf,
  windowSlotsOn,
} from '../utils'
import { useSlotBooking } from './use-slot-booking'

/**
 * What a booking picker shows (D102, D133, D134): the week's allowed days, each day's free times
 * — inside Open windows when there is a Show-as column — and the day picked, as Calendly and Fresha
 * do: the first day still holding a free time unless the reader picks another.
 */
export function useSlots({
  bind,
  date,
  minutes,
  hours,
  days: asked,
  show,
  allDay = 'busy',
  weekStart,
}: SlotsViewOptions): SlotsView {
  const host = usePaperHost()
  const now = nowMinutes()
  const allowed = asked ?? (show ? EVERY_WEEKDAY : SLOT_DAYS)
  const period = useAgendaPeriod({
    bind,
    date,
    weekStart,
    view: 'week',
    locale: host.locale,
    // Open windows are rows: whether this week still has one is only known once they are read.
    startOffset: show ? 0 : openingWeek(now, weekStart, allowed, hours, minutes),
  })
  const mode = addModeOf(host)
  const booking = useSlotBooking(bind, date, minutes, mode === 'suggest', show, allDay)
  const [choice, setChoice] = useState<{ week: string; day: string } | null>(null)

  const rows = period.state.rows
  const windows = show
    ? busyOf(
        rows.filter((row) => isOpenCell(row[show])),
        date,
        minutes,
      )
    : null
  const holding = rows.filter((row) =>
    takesTime(row[date], show ? row[show] : undefined, { show, allDay }),
  )
  const busy = busyOf(holding, date, minutes)
  const held = busyOf(
    period.requested.map((cell) => ({ [date]: cell })),
    date,
    minutes,
  )
  const isReady = period.state.status === 'ready'
  const daySlots = period.days
    .filter((day) => allowed.includes(weekdayOf(day.key)))
    .map((day) => {
      const slots = !isReady
        ? []
        : windows
          ? windowSlotsOn(day.key, windows, minutes, busy, now, held)
          : slotsOn(day.key, hours, minutes, busy, now, held)
      const free = slots.filter((slot) => !slot.isBooked && !slot.isRequested)
      return { day, slots, free, isPast: isPast(day.key, now) }
    })
  // A pick belongs to the week it was made in; a new week opens on its first free day.
  const picked =
    (choice?.week === period.label && daySlots.find((each) => each.day.key === choice.day)) ||
    daySlots.find((each) => each.day.isToday && each.free.length > 0) ||
    daySlots.find((each) => each.free.length > 0) ||
    daySlots[0] ||
    null

  return {
    period,
    booking,
    mode,
    daySlots,
    picked,
    pick: (day) => setChoice({ week: period.label, day }),
  }
}
