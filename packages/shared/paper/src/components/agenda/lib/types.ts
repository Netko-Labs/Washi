import type { Cell } from '@washi/ink'
import type { BindState, BlockProps, Row, RowGuest, When } from '../../../lib/types'
import type { BindQuery } from '../../../registry'

export type WeekStart = 'monday' | 'sunday'
export type AgendaView = 'week' | 'month' | 'hours'

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
  /** The hours a time grid shows (`view="hours"`), `08:00-20:00`; a block outside widens it. */
  hours?: string
  /** A Show-as column (D133): Busy rows greyed, Open rows bookable windows behind the rest. */
  show?: string
  /** A page-state key holding `YYYY-MM`: the month shown follows it, and ‹ › Today write it. */
  state?: string
}

export interface AgendaColumns {
  date: string
  title?: string
  time?: string
  end?: string
  badge?: string
  /** The Show-as column (D133). */
  show?: string
}

/** One timed row on one day of a time grid, in minutes past that day's midnight. */
export interface HourBlock {
  row: Row
  from: number
  to: number
  /** It began on an earlier day, or runs past midnight: its edge is drawn open. */
  startsBefore: boolean
  endsAfter: boolean
  /** Its place among the blocks it overlaps, and how many share the width. */
  lane: number
  lanes: number
  /** Show-as Busy: time blocked out, drawn greyed. */
  isBusy: boolean
}

export interface DayBlocks {
  timed: HourBlock[]
  /** Show-as Open: windows to book in, drawn behind the rest. */
  windows: HourBlock[]
  /** Whole days: the row above the hours. */
  allDay: Row[]
}

/** The minutes past midnight a grid draws, `from` to `to`. */
export interface HourRange {
  from: number
  to: number
}

export interface AgendaHoursProps {
  days: AgendaDayInfo[]
  rows: Row[]
  columns: AgendaColumns
  hours: string
  locale?: string
  isLoading: boolean
  onPress: (row: Row, anchor?: EventAnchor) => void
  /** A press on an empty half hour: the day and the cell to seed, `start/end`. */
  onAdd?: (day: string, cell: string) => void
}

export interface AgendaHoursDayProps {
  day: AgendaDayInfo
  blocks: DayBlocks
  range: HourRange
  columns: AgendaColumns
  locale?: string
  isPicked: boolean
  onPress: (row: Row, anchor?: EventAnchor) => void
  onAdd?: (day: string, cell: string) => void
}

export interface AgendaHourBlockProps {
  block: HourBlock
  range: HourRange
  columns: AgendaColumns
  locale?: string
  isWindow?: boolean
  onPress: (row: Row, anchor?: EventAnchor) => void
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
  locale?: string
  onAdd?: () => void
  /** Opens the event's card: its time, its properties, and what can be done with it. */
  onPress?: (row: Row, anchor?: EventAnchor) => void
}

/** The day a + was pressed on, and what is said once its row is sent. */
export interface AgendaAdd {
  /** A day's + or an event's ⋯, whichever is open. */
  pick: AgendaPick
  adding: string | null
  /** The `start/end` a time grid's press seeds, when the add came from one. */
  addingAt: string | null
  open: (day: string, at?: string) => void
  openEvent: (row: Row, anchor?: EventAnchor) => void
  close: () => void
  note: string | null
  landed: () => void
}

export interface AgendaEventProps {
  row: Row
  columns: AgendaColumns
  /** The day it is drawn on: a span over several reads its own part of the hours there. */
  day: string
  locale?: string
  onPress?: (row: Row, anchor?: EventAnchor) => void
}

/** Where the pressed event sits on screen: a wide page opens its card beside it (D134). */
export interface EventAnchor {
  top: number
  left: number
  right: number
  bottom: number
}

/** What a press opened over the agenda: a day's + Form (at a time, from a grid), or an event. */
export type AgendaPick =
  | { kind: 'add'; day: string; at?: string }
  | { kind: 'event'; row: Row; anchor?: EventAnchor }
  | null

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

export type EventMenuPage = 'card' | 'copy' | 'repeat'

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

export interface AgendaEventCardProps {
  row: Row
  table: string
  columns: AgendaColumns
  weekStart: WeekStart
  locale?: string
  /** A member's agenda: the time and properties change in place, and the event can be deleted. */
  canWrite: boolean
  /** Duplicate, Copy to…, Repeat on days… — where the host adds rows. */
  canCopy: boolean
  /** Where the event was pressed: the card opens beside it on a wide screen. */
  anchor?: EventAnchor
  /** Opens the event as its own page; a host without row pages leaves it out. */
  onOpenPage?: (id: string) => void
  onClose: () => void
}

/** A cell patch the event's card writes: its date, or its own time columns too. */
export type EventPatch = Record<string, Cell>

export type EventWriteStatus =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'refused'; reason: string }

export interface EventWrite {
  status: EventWriteStatus
  write: (set: EventPatch) => Promise<void>
  remove: () => Promise<void>
}

export interface AgendaEventWhenProps {
  row: Row
  columns: AgendaColumns
  locale?: string
  /** Without it the time is words; with it, the day and hours to change in place. */
  onChange?: (when: When) => void
}

export interface AgendaEventFieldsProps {
  row: Row
  table: string
  columns: AgendaColumns
  onWrite?: (set: EventPatch) => void
}

export interface AgendaEventActionsProps {
  id: string | null
  canCopy: boolean
  canDelete: boolean
  isBusy: boolean
  onOpenPage?: () => void
  onDuplicate: () => void
  onPage: (page: EventMenuPage) => void
  onDelete: () => void
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

export interface AgendaEventGuestProps {
  id: string | null
}

export type { Row, RowGuest, When }
