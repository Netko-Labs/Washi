/**
 * A date cell taken apart: a day, its optional time, and an optional end. Every part is a wall
 * clock string as the column stores it (`2026-11-09`, `10:30`) — zones never enter.
 */
export interface When {
  /** `YYYY-MM-DD`, or empty for a cell holding nothing. */
  day: string
  /** `HH:MM`, or null for a whole day. */
  time: string | null
  /** The end's day, or null when nothing ends it. A timed end on the start's day repeats it. */
  endDay: string | null
  /** The end's `HH:MM`, or null. */
  endTime: string | null
}

/** One choice in an hours list: the stored time, how it reads, and how long it lasts from a start. */
export interface ClockChoice {
  value: string
  label: string
}
