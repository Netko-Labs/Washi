import type { Scalar } from '@washi/ink'
import type { ReactNode } from 'react'
import type { ThemeId } from '../registry/themes'

export type Variant = 'plain' | 'outline' | 'filled' | 'raised' | 'tape'
export type Tone = 'neutral' | 'accent' | 'info' | 'success' | 'warning' | 'danger'
export type Size = 'sm' | 'md' | 'lg'
export type Emphasis = 'quiet' | 'normal' | 'strong'
export type Gap = 'tight' | 'normal' | 'loose'
export type Feel = 'note' | 'editorial' | 'board' | 'deck'
export type Width = 'page' | 'wide' | 'full'

export interface StyledProps {
  variant?: Variant
  tone?: Tone
  size?: Size
  emphasis?: Emphasis
  span?: number
  width?: Width
  class?: string
}

export interface BlockProps extends StyledProps {
  children?: ReactNode
}

export type Row = Record<string, Scalar>

export type CellKind = 'string' | 'number'

export interface ActionRef {
  verb: string
  [key: string]: unknown
}

export interface BindState {
  rows: Row[]
  status: 'loading' | 'ready' | 'error'
  error: string | null
}

/**
 * Tables that expressions aggregate over, fetched once per sheet and again after
 * every verb — or after anyone else's write. `version` is what bound primitives watch.
 */
export interface DataContextValue {
  tables: Record<string, Row[]>
  version: number
  refresh: () => void
}

export interface PaperSurfaceProps {
  children?: ReactNode
}

export interface SheetLook {
  theme?: ThemeId
  feel?: Feel
  accent?: Tone
  icon?: string
  cover?: string
}

export interface SheetFrameProps extends SheetLook {
  children?: ReactNode
}

export type LookPart = 'icon' | 'cover'

/** What a host lends a page's look: where pictures live, how to draw an icon, how to change one. */
export interface SheetLookHost {
  /** The host's own band under the icon — who is here, the add buttons, a row's properties. */
  band?: ReactNode
  drawIcon?(name: string): ReactNode
  fileUrl?(id: string): string
  pictureUrl?(slug: string): string
  /** A read-only host leaves it out and the look stays still. */
  edit?(part: LookPart, anchor: HTMLElement): void
}

export interface SheetLookProviderProps {
  value: SheetLookHost
  children?: ReactNode
}

export interface SheetCoverProps {
  cover: string
}

export interface SheetMarkProps {
  icon: string
  overCover: boolean
}

export interface RedactProps extends BlockProps {
  reason?: string
}

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
