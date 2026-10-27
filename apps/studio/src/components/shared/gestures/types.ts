export type SwipeAxis = 'x' | 'y'

export interface SwipeOptions {
  axis: SwipeAxis
  /** The direction that counts: 1 is right or down, -1 left or up. */
  sign: 1 | -1
  /** How far the finger travels, in px, before letting go commits. */
  distance: number
  /** Where a swipe may start; anywhere on the handle when left out. */
  startsAt?: (touch: Touch) => boolean
  /** The element that follows the finger; none for a swipe that only opens something. */
  follower?: (handle: HTMLElement) => HTMLElement | null
  onSwipe: () => void
}

export interface SwipeTrack {
  x: number
  y: number
  at: number
  locked: boolean | null
}
