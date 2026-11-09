/** A Slots' slot length, and whether a pending suggestion holds its time too. */
export interface TakenOptions {
  minutes?: number
  pending: boolean
  /** The Show-as column (D133): its Open rows are windows to book in, never what takes a time. */
  show?: string
}

/** The calendar a suggestion's date lands on; a Slots one holds its slot length. */
export interface Booking {
  date: string
  minutes?: number
  /** The Slots' Show-as column (D133): a time must sit inside a row it marks Open. */
  show?: string
}
