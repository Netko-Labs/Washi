import { describe, expect, test } from 'bun:test'
import { firstDay, heatGrid, heatQuery, totalsByDay } from '../lib'

const DAY = 86_400_000
const keyOf = (day: number) => new Date(day * DAY).toISOString().slice(0, 10)

describe('a calendar of days (D103)', () => {
  test('starts on the week’s first day, whole weeks back from today', () => {
    expect(keyOf(firstDay('2026-10-29', 2, 'monday'))).toBe('2026-10-19')
    expect(keyOf(firstDay('2026-10-29', 1, 'sunday'))).toBe('2026-10-25')
  })

  test('counts rows, or sums a value, per day — a moment counts on its day', () => {
    const rows = [
      { date: '2026-10-29', minutes: 30 },
      { date: '2026-10-29T18:00', minutes: 15 },
      { date: '2026-10-27', minutes: 60 },
      { date: null, minutes: 5 },
    ]
    expect(totalsByDay(rows, 'date').get('2026-10-29')).toBe(2)
    expect(totalsByDay(rows, 'date', 'minutes').get('2026-10-29')).toBe(45)
  })

  test('levels each day against the busiest, marks the future, totals only what is shown', () => {
    const from = firstDay('2026-10-29', 2, 'monday')
    const totals = new Map([
      ['2026-10-29', 4],
      ['2026-10-28', 1],
      ['2026-09-01', 99],
    ])
    const grid = heatGrid(totals, from, 2, '2026-10-29', 'en-US')
    const cells = grid.weeks.flat()
    expect(cells.find((cell) => cell.key === '2026-10-29')?.level).toBe(4)
    expect(cells.find((cell) => cell.key === '2026-10-28')?.level).toBe(1)
    expect(cells.find((cell) => cell.key === '2026-10-30')?.isFuture).toBe(true)
    expect(grid.total).toBe(5)
    expect(grid.months).toEqual(['Oct', ''])
  })

  test('the query holds to the days on screen, both ends', () => {
    const from = firstDay('2026-10-29', 2, 'monday')
    expect(heatQuery({ table: 'checkins' }, 'date', from, 2).where).toEqual([
      { column: 'date', op: 'gte', value: '2026-10-19' },
      { column: 'date', op: 'lt', value: '2026-11-02' },
    ])
  })
})
