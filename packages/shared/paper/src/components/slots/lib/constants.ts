import type { Weekday } from './types'

export const SLOT_MINUTES = 30
export const DAY_MINUTES = 24 * 60
export const SLOT_HOURS = '09:00-17:00'
export const SLOT_DAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri']
/** `Date#getUTCDay` order: a day key's weekday without the reader's zone in the way. */
export const WEEKDAYS: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
