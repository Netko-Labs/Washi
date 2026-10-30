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

/** When in a day a schedule fires: at fixed times, or on a repeat. */
export type CronClock = { kind: 'at'; time: string } | { kind: 'every'; text: string }

/** Which days a schedule fires, as a sentence takes them: around its time, or after a repeat. */
export interface CronDays {
  at: (time: string) => string
  after: string
}
