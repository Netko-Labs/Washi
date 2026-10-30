import type { ScrollBox, ScrollEdges } from './types'
import { EDGE_FADES } from './values'

/** Which ends of a sideways strip hide something; a pixel of slack absorbs subpixel widths. */
export function edgesOf({ scrollLeft, clientWidth, scrollWidth }: ScrollBox): ScrollEdges {
  return { start: scrollLeft > 1, end: scrollLeft + clientWidth < scrollWidth - 1 }
}

/** The mask that fades the strip out at each end with more to scroll to. */
export function edgeFade({ start, end }: ScrollEdges): string {
  if (start && end) return EDGE_FADES.both
  if (start) return EDGE_FADES.start
  if (end) return EDGE_FADES.end
  return EDGE_FADES.none
}
