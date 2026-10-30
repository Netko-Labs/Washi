/** One week's rows, read at once: an agenda is a week, never a table dump. */
export const AGENDA_ROW_LIMIT = 500
/** How many event colours the chart ramp offers. */
export const AGENDA_HUES = 5
/** Events a month cell shows before the rest fold under "+N more". */
export const AGENDA_MONTH_LIMIT = 3
/** A range draws on at most this many days; the query looks this far back for one still running. */
export const AGENDA_SPAN_DAYS = 31
/** The most copies one Repeat on days writes: a month of days, the span a range draws on. */
export const AGENDA_COPY_LIMIT = AGENDA_SPAN_DAYS
/** Board's own rank column: a copy lands unranked, as a new row does. */
export const BOARD_RANK_COLUMN = 'rank'
export const DAY_MS = 86_400_000
/** Weekdays as `getUTCDay` counts them, Sunday 0. */
export const EVERY_DAY: readonly number[] = [0, 1, 2, 3, 4, 5, 6]
export const WORKDAYS: readonly number[] = [1, 2, 3, 4, 5]
