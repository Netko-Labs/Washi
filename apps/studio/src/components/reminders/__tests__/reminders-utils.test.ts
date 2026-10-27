import { describe, expect, test } from 'bun:test'
import { dueLabel } from '../lib/utils'

const NOW = new Date(2026, 9, 27, 15, 0)

describe('a hit says when its row is due, from the reader’s today', () => {
  test('ahead, today and behind', () => {
    expect(dueLabel('2026-10-29', NOW)).toBe('is due in 2 days')
    expect(dueLabel('2026-10-28', NOW)).toBe('is due tomorrow')
    expect(dueLabel('2026-10-27', NOW)).toBe('is due today')
    expect(dueLabel('2026-10-26', NOW)).toBe('was due yesterday')
    expect(dueLabel('2026-10-20', NOW)).toBe('was due 7 days ago')
  })
})
