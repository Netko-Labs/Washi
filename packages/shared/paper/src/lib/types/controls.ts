import type { BlockProps } from './style'

/** A `<Select>` choice: the value written to state, shown as itself or a label. */
export type SelectOption = string | { value: string; label: string }

export interface SelectProps extends BlockProps {
  state: string
  label?: string
  options: SelectOption[]
  /** An empty choice that clears the state, so every view filtered on it shows everything. */
  all?: string
}

/** One bar, slice or point of a chart: its label and its number. */
export interface ChartPoint {
  label: string
  value: number
}

export interface ChartBarsProps {
  points: ChartPoint[]
  locale?: string
}
