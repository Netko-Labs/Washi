/** A Slots' slot length, and whether a pending suggestion holds its time too. */
export interface TakenOptions {
  minutes?: number
  pending: boolean
}

/** The calendar a suggestion's date lands on; a Slots one holds its slot length. */
export interface Booking {
  date: string
  minutes?: number
}
