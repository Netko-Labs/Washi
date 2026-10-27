import type { SwipeAxis } from './types'

/** px per ms that commits a short flick, the way a sheet is flung shut. */
const FLICK_SPEED = 0.5
const FLICK_MIN = 24
/** px of travel before the swipe decides whether it is ours or the page's scroll. */
export const LOCK_SLOP = 8

export function travel(axis: SwipeAxis, sign: 1 | -1, dx: number, dy: number): number {
  return Math.max(0, sign * (axis === 'x' ? dx : dy))
}

/** Ours when it moves more along the axis, in the direction that counts, than across it. */
export function isOwnGesture(axis: SwipeAxis, sign: 1 | -1, dx: number, dy: number): boolean {
  const along = axis === 'x' ? dx : dy
  const across = axis === 'x' ? dy : dx
  return sign * along > 0 && Math.abs(along) > Math.abs(across)
}

export function commits(moved: number, elapsedMs: number, distance: number): boolean {
  return moved >= distance || (moved >= FLICK_MIN && moved / Math.max(1, elapsedMs) >= FLICK_SPEED)
}
