import { describe, expect, test } from 'bun:test'
import { pushRecent, relativeAge } from '../utils'

describe('recents', () => {
  test('newest first, no repeats, three at most', () => {
    let list = pushRecent([], 'a', 1)
    list = pushRecent(list, 'b', 2)
    list = pushRecent(list, 'c', 3)
    list = pushRecent(list, 'a', 4)
    expect(list.map((entry) => entry.id)).toEqual(['a', 'c', 'b'])
    list = pushRecent(list, 'd', 5)
    expect(list.map((entry) => entry.id)).toEqual(['d', 'a', 'c'])
  })

  test('ages read like a person says them', () => {
    const now = 10 * 24 * 3_600_000
    expect(relativeAge(now - 20_000, now)).toBe('now')
    expect(relativeAge(now - 5 * 60_000, now)).toBe('5m')
    expect(relativeAge(now - 2 * 3_600_000, now)).toBe('2h')
    expect(relativeAge(now - 3 * 24 * 3_600_000, now)).toBe('3d')
  })
})
