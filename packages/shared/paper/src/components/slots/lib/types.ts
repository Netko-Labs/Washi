import type { BlockProps } from '../../../lib/types'
import type { BindQuery } from '../../../registry'

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export interface SlotsProps extends BlockProps {
  bind: BindQuery
  date: string
  minutes?: number
  hours?: string
  days?: Weekday[]
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
