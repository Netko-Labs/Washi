import type { AddMode, BlockProps } from '../../../lib/types'
import type { BindQuery } from '../../../registry'
import type { AgendaDayInfo, AgendaPeriod } from '../../agenda'

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export interface SlotsProps extends BlockProps {
  bind: BindQuery
  date: string
  minutes?: number
  hours?: string
  days?: Weekday[]
  /** A Show-as column (D133): slots only inside its Open rows; every other row takes time. */
  show?: string
  /** `free`: an all-day row takes no time unless its Show-as says Busy, as Outlook keeps one (D134). */
  allDay?: 'busy' | 'free'
  add?: string[]
  addLabel?: string
  empty?: string
  weekStart?: 'monday' | 'sunday'
}

/** One bookable time, as wall-clock strings: `2026-10-29T10:00`. */
export interface Slot {
  start: string
  end: string
  label: string
}

/** A slot as a day draws it: a booked one stays on screen, struck through. */
export interface DaySlot extends Slot {
  isBooked: boolean
  /** A visitor asked for it and nobody has decided yet (D120). */
  isRequested: boolean
}

export type WeekStart = NonNullable<SlotsProps['weekStart']>

/** A taken stretch of time, in wall-clock minutes since the epoch day. */
export interface Busy {
  from: number
  to: number
}

export interface SlotBooking {
  picked: Slot | null
  pick: (slot: Slot) => void
  close: () => void
  check: () => Promise<string | null>
  /** "Booked Tue 3 Nov, 10:00" for a few seconds once the row has landed. */
  booked: string | null
  landed: () => void
}

export interface SlotsViewOptions {
  bind: BindQuery
  date: string
  minutes: number
  hours: string
  days?: Weekday[]
  show?: string
  allDay?: 'busy' | 'free'
  weekStart: WeekStart
}

/** One allowed day of the week: every slot it draws, and the ones still free. */
export interface SlotDay {
  day: AgendaDayInfo
  slots: DaySlot[]
  free: DaySlot[]
  isPast: boolean
}

export interface SlotsView {
  period: AgendaPeriod
  booking: SlotBooking
  mode: AddMode
  daySlots: SlotDay[]
  /** The day whose times show: the reader's pick, else the first still holding a free time. */
  picked: SlotDay | null
  pick: (day: string) => void
}

export interface SlotsDaysProps {
  view: SlotsView
  isLoading: boolean
  /** A form to book with, on a host that adds or suggests: else times are read, not pressed. */
  canBook: boolean
  empty: string
  locale?: string
}
