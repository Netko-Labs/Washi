import { type RefObject, useLayoutEffect, useRef } from 'react'
import type { SlidePosition } from '../types'
import { SLIDE_EASING, SLIDE_MS } from '../values'

function layoutOf(element: HTMLElement): SlidePosition {
  const column = element.offsetParent as HTMLElement | null
  return {
    x: element.offsetLeft + (column?.offsetLeft ?? 0),
    y: element.offsetTop + (column?.offsetTop ?? 0),
  }
}

/**
 * FLIP: every `[data-slide]` that moved since the last render glides from where it was. Layout
 * offsets, not rects, so a scroll or a slide in flight never reads as a move; an interrupted
 * slide starts from where it visibly is.
 */
export function useSlide(boardRef: RefObject<HTMLElement | null>) {
  const last = useRef(new Map<string, SlidePosition>())

  useLayoutEffect(() => {
    const board = boardRef.current
    if (!board) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const next = new Map<string, SlidePosition>()
    for (const element of board.querySelectorAll<HTMLElement>('[data-slide]')) {
      const key = element.dataset.slide ?? ''
      const now = layoutOf(element)
      next.set(key, now)
      const before = last.current.get(key)
      if (!before || still) continue
      const dx = before.x - now.x
      const dy = before.y - now.y
      if (dx === 0 && dy === 0) continue
      const transform = getComputedStyle(element).transform
      const inFlight = new DOMMatrixReadOnly(transform === 'none' ? undefined : transform)
      for (const animation of element.getAnimations()) animation.cancel()
      element.animate(
        [
          { transform: `translate(${dx + inFlight.m41}px, ${dy + inFlight.m42}px)` },
          { transform: 'none' },
        ],
        { duration: SLIDE_MS, easing: SLIDE_EASING },
      )
    }
    last.current = next
  })
}
