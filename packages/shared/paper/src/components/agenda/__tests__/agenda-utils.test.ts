import { describe, expect, test } from 'bun:test'
import {
  eventTime,
  eventTitle,
  isoDay,
  monthKey,
  monthOf,
  monthSpan,
  rangeQuery,
  rowsByDay,
  weekLabel,
  weekStartOf,
} from '../lib'

describe('agenda week', () => {
  test('a week starts on its Monday, or Sunday, on the local clock', () => {
    const wednesday = new Date(2026, 9, 28, 23, 30)
    expect(isoDay(weekStartOf(wednesday, 'monday', 0))).toBe('2026-10-26')
    expect(isoDay(weekStartOf(wednesday, 'sunday', 0))).toBe('2026-10-25')
    expect(isoDay(weekStartOf(wednesday, 'monday', 1))).toBe('2026-11-02')
    const sunday = new Date(2026, 10, 1)
    expect(isoDay(weekStartOf(sunday, 'monday', 0))).toBe('2026-10-26')
  })

  test('the label names the year once and the month again only across months', () => {
    expect(weekLabel(new Date(2026, 9, 26), 'en-US')).toBe('Oct 26 – Nov 1, 2026')
    expect(weekLabel(new Date(2026, 10, 2), 'en-US')).toBe('Nov 2 – 8, 2026')
  })

  test('the query keeps its filters and adds the week', () => {
    const query = rangeQuery(
      { table: 'events', where: [{ column: 'kind', op: 'eq', value: 'work' }] },
      'date',
      '2026-10-26',
      '2026-11-02',
    )
    expect(query.where).toEqual([
      { column: 'kind', op: 'eq', value: 'work' },
      { column: 'date', op: 'gte', value: '2026-10-26' },
      { column: 'date', op: 'lt', value: '2026-11-02' },
    ])
    expect(query.orderBy).toEqual({ column: 'date', direction: 'asc' })
  })

  test('rows fall on their day, whatever follows the date', () => {
    const days = rowsByDay(
      [
        { id: 'a', date: '2026-10-28' },
        { id: 'b', date: '2026-10-28T09:00' },
        { id: 'c', date: null },
      ],
      'date',
    )
    expect(days.get('2026-10-28')?.map((row) => row.id)).toEqual(['a', 'b'])
  })

  test('an event reads its time span and its name', () => {
    const columns = { date: 'date', time: 'start', end: 'end' }
    expect(eventTime({ start: '09:00', end: '2026-10-28T10:30' }, columns)).toBe('09:00–10:30')
    expect(eventTitle({ id: 'x', date: '2026-10-28', title: 'Dentist' }, columns)).toBe('Dentist')
  })
})

describe('agenda month', () => {
  test('the grid is whole weeks around the month, its neighbours marked outside', () => {
    const span = monthSpan(new Date(2026, 10, 1), 'monday', '2026-11-04', 'en-US')
    expect(span.label).toBe('November 2026')
    expect(span.days[0]?.key).toBe('2026-10-26')
    expect(span.days.length).toBe(42)
    expect(span.days.at(-1)?.key).toBe('2026-12-06')
    expect(span.days[0]?.isOutside).toBe(true)
    expect(span.days.find((day) => day.key === '2026-11-04')).toMatchObject({
      isOutside: false,
      isToday: true,
    })
  })

  test('a month that starts on the week start needs no leading days', () => {
    const span = monthSpan(new Date(2027, 1, 1), 'monday', '2027-02-10', 'en-US')
    expect(span.days[0]?.key).toBe('2027-02-01')
    expect(span.days.length).toBe(28)
  })

  test('page state names a month as YYYY-MM, or a day in it; anything else is none', () => {
    expect(monthKey(monthOf('2026-11') ?? new Date(0))).toBe('2026-11')
    expect(monthKey(monthOf('2026-11-18') ?? new Date(0))).toBe('2026-11')
    expect(monthOf('2026-13')).toBeNull()
    expect(monthOf('All months')).toBeNull()
    expect(monthOf(null)).toBeNull()
  })
})
