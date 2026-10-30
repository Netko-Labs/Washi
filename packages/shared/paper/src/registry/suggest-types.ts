/** Where a page's link may add a row (D120): the element, its table, the columns it writes. */
export interface SuggestTarget {
  element: 'form' | 'agenda' | 'slots' | 'board'
  table: string
  /** The columns it shows; null is every stored column, a Form without `fields`. */
  fields: string[] | null
  /** Written without being shown: a calendar's date, a board's group, a form's defaults. */
  seeded: string[]
  /** A Board's title column, when it names one. */
  title?: string
  /** A calendar's date column: what a pending suggestion holds there is drawn as Requested. */
  date?: string
  /** A Slots' slot length: a time it holds may not be asked for twice. */
  minutes?: number
}

/** A stretch of wall-clock minutes since the epoch day; zones never enter. */
export interface Span {
  from: number
  to: number
}
