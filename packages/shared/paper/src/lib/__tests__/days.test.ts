import { describe, expect, test } from 'bun:test'
import { whenLabel } from '../days'

const NOW = new Date(2026, 9, 30, 12)

describe('a date cell in words', () => {
  test('a day, a moment and a range read as dates', () => {
    expect(whenLabel('2026-10-31', 'en-US', NOW)).toBe('Oct 31')
    expect(whenLabel('2026-10-31T10:00', 'en-US', NOW)).toMatch(/^Oct 31\D+10:00/)
    expect(whenLabel('2026-10-29/2026-10-31', 'en-US', NOW)).toBe('Oct 29 – Oct 31')
  })

  test('a year other than this one is spelled out, four digits', () => {
    expect(whenLabel('0001-01-01', 'en-US', NOW)).toBe('Jan 1, 0001')
    expect(whenLabel('2025-03-04', 'en-US', NOW)).toBe('Mar 4, 2025')
    expect(whenLabel('2027-01-02T09:30', 'en-US', NOW)).toMatch(/^Jan 2, 2027\D+09:30/)
    expect(whenLabel('2026-12-30/2027-01-02', 'en-US', NOW)).toBe('Dec 30 – Jan 2, 2027')
  })

  test('text that only starts with a date is left exactly as written', () => {
    expect(whenLabel('2026-10-31T10:00 kickoff', 'en-US')).toBe('2026-10-31T10:00 kickoff')
    expect(whenLabel('2026-10-31 notes', 'en-US')).toBe('2026-10-31 notes')
    expect(whenLabel('2026-10-29/later', 'en-US')).toBe('2026-10-29/later')
  })
})
