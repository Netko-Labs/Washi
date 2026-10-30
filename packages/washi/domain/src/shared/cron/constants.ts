export const FIELD_RANGES = [
  [0, 59],
  [0, 23],
  [1, 31],
  [1, 12],
  [0, 7],
] as const

export const FIELD_NAMES = ['Minute', 'Hour', 'Day of month', 'Month', 'Day of week'] as const

/** Far enough ahead to reach any date a calendar has: a 29 February is at most eight years off. */
export const NEXT_SEARCH_DAYS = 8 * 366

export const DAY_MINUTES = 24 * 60

export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]
