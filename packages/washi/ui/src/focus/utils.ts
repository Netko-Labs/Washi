import { FOCUSABLE } from './constants'

export function focusablesIn(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (node) =>
      node.tabIndex >= 0 && !node.hasAttribute('disabled') && node.getClientRects().length > 0,
  )
}

/**
 * Where Tab lands inside a trap of `count` stops from `index` (-1: focus is outside): around to
 * the other end at an edge, null where the browser's own move already stays inside.
 */
export function wrapIndex(count: number, index: number, backwards: boolean): number | null {
  if (count === 0) return null
  if (index < 0) return backwards ? count - 1 : 0
  if (backwards) return index === 0 ? count - 1 : null
  return index === count - 1 ? 0 : null
}
