import type { Scalar } from '@washi/ink'
import type { ReactNode } from 'react'

export type Variant = 'plain' | 'outline' | 'filled' | 'raised' | 'tape'
export type Tone = 'neutral' | 'accent' | 'info' | 'success' | 'warning' | 'danger'
export type Size = 'sm' | 'md' | 'lg'
export type Emphasis = 'quiet' | 'normal' | 'strong'
export type Gap = 'tight' | 'normal' | 'loose'
export type Feel = 'note' | 'editorial' | 'board' | 'deck'

export interface StyledProps {
  variant?: Variant
  tone?: Tone
  size?: Size
  emphasis?: Emphasis
  span?: number
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
