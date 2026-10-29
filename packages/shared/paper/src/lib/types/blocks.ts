import type { ReactNode } from 'react'
import type { DatabaseContext } from '../../components/database'
import type { BindHistoryQuery, BindQuery } from '../../registry'
import type { ChartPoint } from './controls'
import type { ActionRef, BindState, Row } from './data'
import type { BlockProps, Gap, Size } from './style'

export interface BoundProps {
  state: BindState
  empty?: string
  children: (rows: BindState['rows']) => ReactNode
}

export type Marker = 'bullet' | 'number' | 'check'

export interface TitleProps extends BlockProps {
  level?: 1 | 2 | 3
}

export interface TextProps extends BlockProps {
  lead?: boolean
}

export interface ListProps extends BlockProps {
  marker?: Marker
}

export interface ItemProps extends BlockProps {
  done?: boolean
}

export interface CodeProps extends BlockProps {
  lang?: string
}

export interface PairProps extends BlockProps {
  term: string
}

export interface NoteProps extends BlockProps {
  number: number
}

export interface SourceProps extends BlockProps {
  number: number
}

export interface MoneyProps extends BlockProps {
  value?: number
  expr?: string
  currency: string
}

export interface RefProps extends BlockProps {
  sheet: string
}

export interface DrawerProps extends Omit<BlockProps, 'children'> {
  state: string
  bind?: BindQuery
  title?: string
  children: (row: Row | null) => ReactNode
}

export interface SchemaProps extends BlockProps {
  table: string
}

export interface MascotProps extends BlockProps {
  mood?: string
  size?: Size
}

export interface MissingProps {
  kind: string
  reason: string
}

export interface ShowProps {
  expr: string
  children?: ReactNode
}

export interface TabsProps extends BlockProps {
  labels: string[]
  state?: string
}

export interface RevealProps extends BlockProps {
  label: string
  state?: string
}

export interface SectionProps extends BlockProps {
  title?: string
  gap?: Gap
}

export interface RowProps extends BlockProps {
  gap?: Gap
  align?: string
}

export interface StackProps extends BlockProps {
  gap?: Gap
  align?: string
}

export interface GridProps extends BlockProps {
  gap?: Gap
}

export interface CardProps extends BlockProps {
  title?: string
}

export interface CalloutProps extends BlockProps {
  title?: string
}

export interface HeroProps extends BlockProps {
  title: string
  subtitle?: string
  align?: 'left' | 'center'
}

export interface FigureProps extends BlockProps {
  src: string
  alt: string
  caption?: string
  ratio?: string
}

export type FieldKind = 'text' | 'number' | 'date' | 'select' | 'boolean'

export interface FieldProps extends BlockProps {
  field: string
  kind: FieldKind
  label?: string
  help?: string
  table?: string
  row?: string
}

export interface ButtonProps extends BlockProps {
  action: ActionRef
}

export interface ComposeProps extends BlockProps {
  action: ActionRef
  label?: string
  placeholder?: string
  multiline?: boolean
}

export interface TaskProps extends BlockProps {
  row?: string
  done?: boolean
  field?: string
}

export interface SwitchProps extends BlockProps {
  state: string
  label?: string
}

export interface SliderProps extends BlockProps {
  state: string
  min?: number
  max?: number
  step?: number
  label?: string
}

export interface ChartLook extends BlockProps {
  kind: 'bar' | 'line' | 'area' | 'donut'
  label?: string
  value?: string
  empty?: string
}

export interface ChartProps extends ChartLook {
  bind?: BindQuery
  history?: BindHistoryQuery
}

export interface BoundChartProps extends ChartLook {
  bind?: BindQuery
}

export interface HistoryChartProps extends ChartLook {
  history: BindHistoryQuery
}

export interface ChartBodyProps extends ChartLook {
  state: BindState
}

export interface ChartLinesProps {
  points: ChartPoint[]
  area: boolean
  locale?: string
}

export interface ChartDonutProps {
  points: ChartPoint[]
}

export interface TableProps extends BlockProps {
  bind: BindQuery
  columns?: string[]
  empty?: string
}

export interface TableValueProps {
  row: Row
  name: string
  isTitle: boolean
  db: DatabaseContext | null
  locale?: string
}

export interface RepeatProps extends Omit<BlockProps, 'children'> {
  bind: BindQuery
  empty?: string
  children: (row: Row) => ReactNode
}

export interface StatProps extends BlockProps {
  value?: string | number
  expr?: string
  label: string
  hint?: string
  trend?: 'up' | 'down' | 'flat'
  format?: 'number' | 'percent'
  currency?: string
}

export interface StepProps extends BlockProps {
  marker?: string
  title?: string
}

export interface ProgressProps extends BlockProps {
  value?: number | string
  expr?: string
  label?: string
}

export interface BadgeProps extends BlockProps {
  expr?: string
}

export interface AvatarProps extends BlockProps {
  label: string
}
