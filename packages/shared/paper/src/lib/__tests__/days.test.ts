import { describe, expect, test } from 'bun:test'
import { whenLabel } from '../days'

describe('a date cell in words', () => {
  test('a day, a moment and a range read as dates', () => {
    expect(whenLabel('2026-10-31', 'en-US')).toBe('Oct 31')
    expect(whenLabel('2026-10-31T10:00', 'en-US')).toMatch(/^Oct 31\D+10:00/)
    expect(whenLabel('2026-10-29/2026-10-31', 'en-US')).toBe('Oct 29 – Oct 31')
  })

  test('text that only starts with a date is left exactly as written', () => {
    expect(whenLabel('2026-10-31T10:00 kickoff', 'en-US')).toBe('2026-10-31T10:00 kickoff')
    expect(whenLabel('2026-10-31 notes', 'en-US')).toBe('2026-10-31 notes')
    expect(whenLabel('2026-10-29/later', 'en-US')).toBe('2026-10-29/later')
  })
})
