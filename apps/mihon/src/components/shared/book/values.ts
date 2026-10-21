import type { Accent, BookState, Feel, Mode, View, Width } from './types'

export const MODES: readonly Mode[] = ['light', 'dark']
export const FEELS: readonly Feel[] = ['note', 'editorial', 'board', 'deck']
export const ACCENTS: readonly Accent[] = ['accent', 'info', 'success', 'warning', 'danger']
export const WIDTHS: readonly Width[] = ['320', '400', '720', 'full']
export const VIEWS: readonly View[] = ['single', 'matrix', 'scratch']

export const GROUP_LABELS: Record<string, string> = {
  frame: 'Frame',
  text: 'Text',
  surface: 'Surface',
  dataOut: 'Data out',
  dataIn: 'Data in',
  flow: 'Flow',
  kit: 'Kit',
}

export const BOOK_DEFAULTS: BookState = {
  primitive: 'Card',
  knobs: {},
  childrenText: null,
  theme: 'washi',
  mode: 'light',
  feel: 'note',
  accent: 'accent',
  width: '720',
  view: 'single',
  scratch: null,
  query: '',
}
