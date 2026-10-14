import { describe, expect, test } from 'bun:test'
import type { SheetSummary } from '@washi/domain'
import { byRecent, relativeTime } from '../utils'

const hlcAt = (ms: number) => `${String(ms).padStart(14, '0')}:0000:device`
const sheet = (id: string, ms: number) =>
  ({ id, title: id, icon: null, tags: [], hlcUpdated: hlcAt(ms) }) as SheetSummary

describe('where a person left off', () => {
  test('most recently edited first', () => {
    const now = Date.now()
    const order = byRecent([
      sheet('old', now - 86_400_000),
      sheet('new', now),
      sheet('mid', now - 60_000),
    ])
    expect(order.map((entry) => entry.id)).toEqual(['new', 'mid', 'old'])
  })

  test('edited times read like a person says them', () => {
    expect(relativeTime(hlcAt(Date.now()))).toBe('just now')
    expect(relativeTime(hlcAt(Date.now() - 5 * 60_000))).toBe('5 min ago')
    expect(relativeTime(hlcAt(Date.now() - 26 * 3_600_000))).toBe('yesterday')
    expect(relativeTime('garbage')).toBe('recently')
  })
})
