import { describe, expect, test } from 'bun:test'
import {
  cronProblem,
  describeCron,
  isCron,
  latestOccurrence,
  nextOccurrence,
  parseCron,
} from '../index'

describe('cron', () => {
  test('parses lists, ranges and steps; refuses what is out of range', () => {
    const fields = parseCron('*/15 9-17 * * 1,3,5')
    expect([...(fields?.minute ?? [])]).toEqual([0, 15, 30, 45])
    expect(fields?.hour.size).toBe(9)
    expect([...(fields?.dayOfWeek ?? [])]).toEqual([1, 3, 5])
    expect(parseCron('0 0 * * 7')?.dayOfWeek.has(0)).toBe(true)
    for (const bad of ['', '60 * * * *', '* * * *', '0 25 * * *', '5-1 * * * *', '*/0 * * * *']) {
      expect(isCron(bad)).toBe(false)
    }
  })

  test('says a plain schedule in words, else shows the expression', () => {
    expect(describeCron('0 9 * * *')).toBe('Every day at 09:00')
    expect(describeCron('30 8 * * 1-5')).toBe('Every weekday at 08:30')
    expect(describeCron('0 10 * * 0,6')).toBe('Weekends at 10:00')
    expect(describeCron('0 17 * * 5')).toBe('Every Friday at 17:00')
    expect(describeCron('15 * * * *')).toBe('Every hour at :15')
    expect(describeCron('0 * * * 1')).toBe('Every hour at :00 on Mondays')
    expect(describeCron('0 9 * * 0-6')).toBe('Every day at 09:00')
  })

  test('says dates, weekday lists and repeats in words', () => {
    expect(describeCron('0 3 1 1 *')).toBe('At 03:00 on 1 January')
    expect(describeCron('30 9 15 * *')).toBe('At 09:30 on day 15 of every month')
    expect(describeCron('0 9 1,15 * *')).toBe('At 09:00 on days 1 and 15 of every month')
    expect(describeCron('0 9 1 1,4,7,10 *')).toBe(
      'At 09:00 on day 1 of January, April, July and October',
    )
    expect(describeCron('0 9 * 12 *')).toBe('Every day in December at 09:00')
    expect(describeCron('0 8 * * 1,3,5')).toBe('At 08:00 on Mon, Wed and Fri')
    expect(describeCron('0 8 * * 0,1')).toBe('At 08:00 on Mon and Sun')
    expect(describeCron('0 8 * * 2-4')).toBe('At 08:00 on Tue, Wed and Thu')
    expect(describeCron('0 9,17 * * *')).toBe('Every day at 09:00 and 17:00')
    expect(describeCron('*/15 * * * *')).toBe('Every 15 minutes')
    expect(describeCron('*/15 * * * 1-5')).toBe('Every 15 minutes on weekdays')
    expect(describeCron('* * * * *')).toBe('Every minute')
    expect(describeCron('0 */6 * * *')).toBe('Every 6 hours at :00')
    expect(describeCron('30 */2 * * 6')).toBe('Every 2 hours at :30 on Saturdays')
  })

  test('keeps the expression where words would mislead', () => {
    for (const raw of [
      '*/7 * * * *',
      '*/15 9-17 * * *',
      '0 9-17 * * *',
      '0 9 1 * 1',
      '0 9 * 1 1',
      '0 9 */2 * *',
      '0 9 1,2,3,4,5 * *',
    ]) {
      expect(describeCron(raw)).toBe(raw)
    }
  })

  test('occurrences are wall-clock minutes in the zone, today only for the latest', () => {
    const now = new Date('2026-10-08T15:30:00Z')
    expect(latestOccurrence('0 9 * * *', 'America/Bogota', now)).toBe('2026-10-08T09:00')
    expect(latestOccurrence('0 11 * * *', 'America/Bogota', now)).toBeNull()
    expect(nextOccurrence('0 11 * * *', 'America/Bogota', now)).toBe('2026-10-08T11:00')
    expect(nextOccurrence('0 9 * * 1', 'UTC', now)).toBe('2026-10-12T09:00')
  })

  test('the next run is found however far off, and a date that never comes is none', () => {
    const now = new Date('2026-10-08T15:30:00Z')
    expect(nextOccurrence('0 3 1 1 *', 'UTC', now)).toBe('2027-01-01T03:00')
    expect(nextOccurrence('0 0 29 2 *', 'UTC', now)).toBe('2028-02-29T00:00')
    expect(nextOccurrence('31 15 * * *', 'UTC', now)).toBe('2026-10-08T15:31')
    expect(nextOccurrence('30 15 * * *', 'UTC', now)).toBe('2026-10-09T15:30')
    expect(nextOccurrence('0 9 13 * 5', 'UTC', now)).toBe('2026-10-09T09:00')
    expect(nextOccurrence('0 0 31 2 *', 'UTC', now)).toBeNull()
  })

  test('says why an expression is not a schedule', () => {
    expect(cronProblem('0 3 1 1 *')).toBeNull()
    expect(cronProblem('99 99 * * *')).toBe('Minute “99” is not in 0–59.')
    expect(cronProblem('0 25 * * *')).toBe('Hour “25” is not in 0–23.')
    expect(cronProblem('0 9 * *')).toContain('five fields')
    expect(cronProblem('')).toContain('this has 0')
  })
})
