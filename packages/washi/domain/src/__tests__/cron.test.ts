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
    expect(describeCron('0 * * * 1')).toBe('0 * * * 1')
    expect(describeCron('0 9 1 * *')).toBe('0 9 1 * *')
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
