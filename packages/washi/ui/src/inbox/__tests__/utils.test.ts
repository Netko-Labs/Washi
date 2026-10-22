import { describe, expect, test } from 'bun:test'
import type { InboxRow } from '../lib'
import { dayLabel, groupByDay, matchesFilter, whenLabel } from '../lib'

const HOUR = 3_600_000
const DAY = 24 * HOUR
// A Wednesday at 15:00 local time.
const now = new Date(2026, 9, 21, 15, 0, 0).getTime()

const row = (id: string, at: number, kind: InboxRow['kind'] = 'washi'): InboxRow => ({
  id,
  kind,
  at,
  who: null,
  verb: '',
  where: null,
  detail: null,
})

describe('inbox time', () => {
  test('day labels read like a person says them', () => {
    expect(dayLabel(now - HOUR, now)).toBe('Today')
    expect(dayLabel(now - DAY, now)).toBe('Yesterday')
    expect(dayLabel(now - 2 * DAY, now)).toBe('Monday')
    expect(dayLabel(now - 8 * DAY, now)).toBe('Tue 13 Oct')
  })

  test('the time on the right counts up, then tells the time, then the day', () => {
    expect(whenLabel(now - 10_000, now)).toBe('now')
    expect(whenLabel(now - 25 * 60_000, now)).toBe('25 min')
    expect(whenLabel(now - 3 * HOUR, now)).toBe('3 h')
    expect(whenLabel(now - 7 * HOUR, now)).toBe('08:00')
    expect(whenLabel(now - DAY, now)).toBe('Tue')
  })
})

describe('inbox list', () => {
  test('newest first, cut by day', () => {
    const groups = groupByDay(
      [row('old', now - 2 * DAY), row('new', now - 1000), row('today', now - HOUR)],
      now,
    )
    expect(groups.map((group) => group.label)).toEqual(['Today', 'Monday'])
    expect(groups[0]?.rows.map((each) => each.id)).toEqual(['new', 'today'])
  })

  test('filters: needs shows no rows, the rest match the kind', () => {
    const mention = row('m', now, 'mention')
    expect(matchesFilter(mention, 'all')).toBe(true)
    expect(matchesFilter(mention, 'needs')).toBe(false)
    expect(matchesFilter(mention, 'mentions')).toBe(true)
    expect(matchesFilter(mention, 'washi')).toBe(false)
  })
})
