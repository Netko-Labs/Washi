import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { DEFAULT_OFFSET } from './constants'
import { useFloatingBox } from './hooks/use-floating-box'
import type { FloatingProps } from './types'

/**
 * A popover drawn on the body, above everything: no card's `overflow: hidden` and no sidebar's
 * stacking context can clip it. `data-floating` tells `useDismiss` a press here is not outside.
 */
export function Floating({
  anchor,
  side = 'bottom',
  align = 'start',
  offset = DEFAULT_OFFSET,
  className = '',
  children,
  ...aria
}: FloatingProps) {
  const ref = useRef<HTMLDivElement>(null)
  const box = useFloatingBox(anchor, ref, side, align, offset)

  return createPortal(
    <div
      ref={ref}
      data-floating
      {...aria}
      className={`fixed z-[80] ${className}`}
      style={box ? { top: box.top, left: box.left } : { top: 0, left: 0, visibility: 'hidden' }}
    >
      {children}
    </div>,
    document.body,
  )
}
