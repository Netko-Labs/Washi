import type { ScrollEdges } from './types'

export const NO_EDGES: ScrollEdges = { start: false, end: false }

export const EDGE_FADES = {
  none: '',
  start: '[mask-image:linear-gradient(to_right,transparent,#000_32px)]',
  end: '[mask-image:linear-gradient(to_left,transparent,#000_32px)]',
  both: '[mask-image:linear-gradient(to_right,transparent,#000_32px,#000_calc(100%_-_32px),transparent)]',
}
