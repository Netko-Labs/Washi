import { type RefObject, useLayoutEffect, useState } from 'react'
import type { FloatingAlign, FloatingBox, FloatingSide } from '../types'
import { placeFloating } from '../utils'

/**
 * Where the popover sits, recomputed on any scroll (capture: a scrolling card moves the anchor)
 * and on resize — `window` because the viewport is the only thing that announces it.
 */
export function useFloatingBox(
  anchor: RefObject<HTMLElement | null>,
  floating: RefObject<HTMLElement | null>,
  side: FloatingSide,
  align: FloatingAlign,
  offset: number,
): FloatingBox | null {
  const [box, setBox] = useState<FloatingBox | null>(null)

  useLayoutEffect(() => {
    const place = () => {
      const from = anchor.current
      const node = floating.current
      if (!from || !node) return
      setBox(
        placeFloating(
          from.getBoundingClientRect(),
          { width: node.offsetWidth, height: node.offsetHeight },
          { width: window.innerWidth, height: window.innerHeight },
          side,
          align,
          offset,
        ),
      )
    }
    place()
    const observer = new ResizeObserver(place)
    if (floating.current) observer.observe(floating.current)
    document.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      observer.disconnect()
      document.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [anchor, floating, side, align, offset])

  return box
}
