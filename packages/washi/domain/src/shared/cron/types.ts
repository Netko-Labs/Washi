/** Five fields — minute, hour, day of month, month, day of week (0 = Sunday) — as sets. */
export interface CronFields {
  minute: ReadonlySet<number>
  hour: ReadonlySet<number>
  dayOfMonth: ReadonlySet<number>
  month: ReadonlySet<number>
  dayOfWeek: ReadonlySet<number>
  /** Whether day of month / day of week were restricted: cron ORs them when both are. */
  isDayOfMonthAny: boolean
  isDayOfWeekAny: boolean
}

/** A wall-clock minute somewhere: what a schedule is matched against. */
export interface WallMinute {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  /** 0 = Sunday. */
  weekday: number
}
