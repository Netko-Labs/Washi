import type { BindState, BlockProps, Row } from '../../../lib/types'
import type { BindQuery } from '../../../registry'

export type WeekStart = 'monday' | 'sunday'

export interface AgendaProps extends BlockProps {
  bind: BindQuery
  /** The column a row falls on: `YYYY-MM-DD`, or anything that starts with one. */
  date: string
  title?: string
  /** Shown before the title — a start time, `09:00`. */
  time?: string
  /** Read after `time` as its end — `09:00–10:30`. */
  end?: string
  /** A short label that also colours the event, one hue per value. */
  badge?: string
  /** Fields for each day's +: a modal Form with that day already in `date`. */
  add?: string[]
  addLabel?: string
  empty?: string
  weekStart?: WeekStart
}

export interface AgendaColumns {
  date: string
  title?: string
  time?: string
  end?: string
  badge?: string
}

export interface AgendaDayInfo {
  key: string
  weekday: string
  day: number
  long: string
  isToday: boolean
}

export interface AgendaWeek {
  days: AgendaDayInfo[]
  label: string
  state: BindState
  isThisWeek: boolean
  shift: (weeks: number) => void
  reset: () => void
}

export interface AgendaWeekOptions {
  bind: BindQuery
  date: string
  weekStart: WeekStart
  locale?: string
}

export interface AgendaDayProps {
  day: AgendaDayInfo
  rows: Row[]
  columns: AgendaColumns
  empty: string
  onAdd?: () => void
  onOpen?: (id: string) => void
}

export interface AgendaEventProps {
  row: Row
  columns: AgendaColumns
  onOpen?: (id: string) => void
}

export type { Row }
