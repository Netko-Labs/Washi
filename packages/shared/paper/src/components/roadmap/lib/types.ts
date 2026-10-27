import type { BlockProps } from '../../../lib/types'
import type { BindQuery } from '../../../registry'

export interface RoadmapProps extends BlockProps {
  bind: BindQuery
  /** The date column: a day, or `start/end`. */
  date: string
  title?: string
  empty?: string
}

export interface Span {
  /** UTC day numbers (days since the epoch), inclusive. */
  start: number
  end: number
}

export interface Calendar {
  first: number
  days: number
}

export interface Tick {
  day: number
  label: string
}

export interface RoadmapRowProps {
  span: Span | null
  calendar: Calendar
  title: string
  onMove: (days: number) => Promise<void>
  onPlace: (day: number) => void
  onOpen: () => void
}

export interface DragShift {
  /** The bar's start day when the shift was made. */
  at: number | null
  days: number
  /** The pointer is still down: the bar follows it whatever the row does meanwhile. */
  held: boolean
}

export interface BarDrag {
  shift: number
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void
}
