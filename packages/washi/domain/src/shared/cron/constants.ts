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

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** Past this many times, days or months, a schedule reads as its expression. */
export const MAX_LISTED = 4
