import type { BindState, BlockProps, Row } from '../../../lib/types'
import type { BindQuery } from '../../../registry'

export type WeekStart = 'monday' | 'sunday'
export type AgendaView = 'week' | 'month'

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
  view?: AgendaView
  /** A page-state key holding `YYYY-MM`: the month shown follows it, and ‹ › Today write it. */
  state?: string
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
  /** A month grid's leading or trailing day from the months beside it. */
  isOutside: boolean
}

export interface AgendaPeriod {
  days: AgendaDayInfo[]
  label: string
  state: BindState
  isCurrent: boolean
  shift: (steps: number) => void
  reset: () => void
}

export interface AgendaPeriodOptions {
  bind: BindQuery
  date: string
  weekStart: WeekStart
  view: AgendaView
  stateKey?: string
  locale?: string
}

export interface AgendaSpan {
  start: Date
  days: AgendaDayInfo[]
  label: string
}

export interface AgendaDayProps {
  day: AgendaDayInfo
  rows: Row[]
  columns: AgendaColumns
  empty: string
  /** Events shown before the rest fold under "+N more". */
  limit?: number
  onAdd?: () => void
  onOpen?: (id: string) => void
}

export interface AgendaEventProps {
  row: Row
  columns: AgendaColumns
  onOpen?: (id: string) => void
}

export type { Row }
