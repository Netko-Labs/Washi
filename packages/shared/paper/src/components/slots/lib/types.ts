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
}
