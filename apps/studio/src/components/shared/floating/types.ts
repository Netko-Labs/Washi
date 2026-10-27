import type { ReactNode, RefObject } from 'react'

export type FloatingSide = 'top' | 'bottom'
export type FloatingAlign = 'start' | 'end'

export interface FloatingProps {
  /** What it hangs from; it opens beside this, flipping or sliding to stay on screen. */
  anchor: RefObject<HTMLElement | null>
  side?: FloatingSide
  align?: FloatingAlign
  /** Gap to the anchor, in px. */
  offset?: number
  role?: string
  'aria-label'?: string
  className?: string
  children: ReactNode
}

export interface FloatingBox {
  top: number
  left: number
}
