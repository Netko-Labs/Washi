import { VIEWPORT_MARGIN } from './constants'
import type { FloatingAlign, FloatingBox, FloatingSide } from './types'

/** Beside the anchor on `side`, the other side when it does not fit, then clamped into view. */
export function placeFloating(
  anchor: DOMRect,
  size: { width: number; height: number },
  viewport: { width: number; height: number },
  side: FloatingSide,
  align: FloatingAlign,
  offset: number,
): FloatingBox {
  const below = anchor.bottom + offset
  const above = anchor.top - offset - size.height
  const fitsBelow = below + size.height <= viewport.height - VIEWPORT_MARGIN
  const fitsAbove = above >= VIEWPORT_MARGIN
  const top =
    side === 'bottom'
      ? fitsBelow || !fitsAbove
        ? below
        : above
      : fitsAbove || !fitsBelow
        ? above
        : below
  const left = align === 'start' ? anchor.left : anchor.right - size.width
  const clamp = (value: number, max: number) =>
    Math.min(Math.max(value, VIEWPORT_MARGIN), Math.max(VIEWPORT_MARGIN, max - VIEWPORT_MARGIN))
  return {
    top: clamp(top, viewport.height - size.height),
    left: clamp(left, viewport.width - size.width),
  }
}
