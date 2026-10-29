import type { BlockProps } from '../../../lib/types'
import type { BindQuery } from '../../../registry'

export interface HeatmapProps extends BlockProps {
  bind: BindQuery
  date: string
  value?: string
  weeks?: number
  label?: string
  weekStart?: 'monday' | 'sunday'
  empty?: string
}

export interface HeatCell {
  /** `2026-10-29`. */
  key: string
  total: number
  /** 0 (nothing) to 4 (the busiest day shown). */
  level: number
  isFuture: boolean
}

export interface HeatGrid {
  /** One array of seven days per week, oldest first. */
  weeks: HeatCell[][]
  /** A month's short name over the week it starts in; empty elsewhere. */
  months: string[]
  total: number
}
