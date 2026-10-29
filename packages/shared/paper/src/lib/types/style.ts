import type { ReactNode } from 'react'

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
