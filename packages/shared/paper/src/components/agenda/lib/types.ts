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
  /** Pending times visitors asked for (D120): held, and drawn as Requested. */
  requested: string[]
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
  /** The week opened on and Today returns to, from this one: a picker skips a spent week. */
  startOffset?: number
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
  /** Pending requests on this day, as start times; empty for a whole day. */
  requested?: string[]
  /** Events shown before the rest fold under "+N more". */
  limit?: number
  onAdd?: () => void
  onOpen?: (id: string) => void
  /** The event's ⋯: Duplicate, Copy to…, Repeat on days…; without it (a read-only host) none. */
  onMenu?: (row: Row) => void
}

/** The day a + was pressed on, and what is said once its row is sent. */
export interface AgendaAdd {
  /** A day's + or an event's ⋯, whichever is open. */
  pick: AgendaPick
  adding: string | null
  open: (day: string) => void
  openEvent: (row: Row) => void
  close: () => void
  note: string | null
  landed: () => void
}

export interface AgendaEventProps {
  row: Row
  columns: AgendaColumns
  onOpen?: (id: string) => void
  onMenu?: (row: Row) => void
}

/** What a press opened over the agenda: a day's + Form, or an event's ⋯. */
export type AgendaPick = { kind: 'add'; day: string } | { kind: 'event'; row: Row } | null

/** The new rows a Repeat on days writes, one per day, each its date moved `shifts` days. */
export interface CopyPlan {
  days: string[]
  shifts: number[]
  cells: string[]
  /** More days matched than one press may copy; nothing is offered. */
  isOver: boolean
}

export interface WeekdayChip {
  /** 0 = Sunday, as `getUTCDay` counts. */
  day: number
  label: string
}

export type EventMenuPage = 'menu' | 'copy' | 'repeat'

export type EventCopyStatus =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'refused'; reason: string }

/** Each entry is one new row: the event's stored cells, the entry's over them. */
export type CopyEntries = Record<string, string>[]

export interface EventCopy {
  status: EventCopyStatus
  copy: (entries: CopyEntries) => Promise<void>
}

export interface AgendaEventMenuProps {
  row: Row
  table: string
  columns: AgendaColumns
  weekStart: WeekStart
  locale?: string
  onClose: () => void
}

export interface AgendaCopyPageProps {
  row: Row
  columns: AgendaColumns
  locale?: string
  isBusy: boolean
  onCopy: (entries: CopyEntries) => void
  onBack: () => void
}

export interface AgendaRepeatProps extends AgendaCopyPageProps {
  weekStart: WeekStart
}

export type { Row }
