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

/** Where an arrow, Home or End lands among `count` items from `index` (-1: none yet). */
export function menuStep(count: number, index: number, key: string): number | null {
  if (count === 0) return null
  if (key === 'Home') return 0
  if (key === 'End') return count - 1
  if (key === 'ArrowDown') return index < 0 ? 0 : (index + 1) % count
  if (key === 'ArrowUp') return index < 0 ? count - 1 : (index - 1 + count) % count
  return null
}
