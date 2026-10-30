import { describe, expect, test } from 'bun:test'
import type { TableSpec } from '@washi/ink'
import {
  AGENDA_COPY_LIMIT,
  copyAction,
  copyDates,
  copyPatch,
  dayGap,
  EVERY_DAY,
  repeatWords,
  shiftCell,
  WORKDAYS,
  weekdayChips,
} from '../lib'

describe('shiftCell', () => {
  test('moves a bare day, a moment and both ends of a range, times kept', () => {
    expect(shiftCell('2026-11-03', 1)).toBe('2026-11-04')
    expect(shiftCell('2026-11-03T10:00', 2)).toBe('2026-11-05T10:00')
    expect(shiftCell('2026-11-03T10:00/2026-11-03T11:00', 3)).toBe(
      '2026-11-06T10:00/2026-11-06T11:00',
    )
    expect(shiftCell('2026-11-03/2026-11-05', 7)).toBe('2026-11-10/2026-11-12')
  })

  test('crosses month and year ends and a leap day on the wall clock', () => {
    expect(shiftCell('2026-10-31T09:30', 1)).toBe('2026-11-01T09:30')
    expect(shiftCell('2026-12-31', 1)).toBe('2027-01-01')
    expect(shiftCell('2028-02-28', 1)).toBe('2028-02-29')
    expect(shiftCell('2027-02-28', 1)).toBe('2027-03-01')
    expect(shiftCell('2026-11-03', -3)).toBe('2026-10-31')
  })

  test('a DST change never moves the hour: zones never enter', () => {
    expect(shiftCell('2026-10-24T09:00/2026-10-24T10:00', 7)).toBe(
      '2026-10-31T09:00/2026-10-31T10:00',
    )
    expect(shiftCell('2026-03-28T02:30', 1)).toBe('2026-03-29T02:30')
    expect(dayGap('2026-03-28', '2026-03-30')).toBe(2)
  })

  test('leaves what is not a day alone', () => {
    expect(shiftCell('soon', 3)).toBe('soon')
    expect(dayGap('soon', '2026-11-03')).toBeNull()
  })
})

describe('copyDates', () => {
  test('every day after the event, through the date', () => {
    const plan = copyDates('2026-11-02T10:00/2026-11-02T11:00', '2026-11-06', EVERY_DAY)
    expect(plan.days).toEqual(['2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06'])
    expect(plan.shifts).toEqual([1, 2, 3, 4])
    expect(plan.cells[0]).toBe('2026-11-03T10:00/2026-11-03T11:00')
    expect(plan.cells.at(-1)).toBe('2026-11-06T10:00/2026-11-06T11:00')
    expect(plan.isOver).toBe(false)
  })

  test('weekdays skip the weekend across a week boundary', () => {
    const plan = copyDates('2026-11-05', '2026-11-11', WORKDAYS)
    expect(plan.days).toEqual(['2026-11-06', '2026-11-09', '2026-11-10', '2026-11-11'])
    expect(plan.cells).toEqual(plan.days)
  })

  test('a bare day repeats as bare days, over a month end', () => {
    const plan = copyDates('2026-11-29', '2026-12-02', EVERY_DAY)
    expect(plan.cells).toEqual(['2026-11-30', '2026-12-01', '2026-12-02'])
  })

  test('picked weekdays only: Tuesdays and Thursdays', () => {
    const plan = copyDates('2026-11-03T18:00', '2026-11-19', [2, 4])
    expect(plan.days).toEqual([
      '2026-11-05',
      '2026-11-10',
      '2026-11-12',
      '2026-11-17',
      '2026-11-19',
    ])
  })

  test('nothing on or before the event day, nor with no weekday', () => {
    expect(copyDates('2026-11-03', '2026-11-03', EVERY_DAY).days).toEqual([])
    expect(copyDates('2026-11-03', '2026-11-01', EVERY_DAY).days).toEqual([])
    expect(copyDates('2026-11-03', '2026-11-30', []).days).toEqual([])
    expect(copyDates('soon', '2026-11-30', EVERY_DAY).days).toEqual([])
  })

  test(`stops at ${AGENDA_COPY_LIMIT}: exactly that many pass, one more is over`, () => {
    const full = copyDates('2026-01-01', '2026-02-01', EVERY_DAY)
    expect(full.days).toHaveLength(31)
    expect(full.days.at(-1)).toBe('2026-02-01')
    expect(full.isOver).toBe(false)
    const over = copyDates('2026-01-01', '2026-02-02', EVERY_DAY)
    expect(over.isOver).toBe(true)
    expect(copyDates('2026-01-01', '2099-12-31', WORKDAYS).isOver).toBe(true)
  })
})

describe('copyPatch', () => {
  const columns = { date: 'when', time: 'starts', end: 'ends', title: 'title' }

  test('moves the date and any time column that holds a day; a bare clock stays', () => {
    const row = { id: 'r1', title: 'Standup', when: '2026-11-03', starts: '09:00', ends: '09:15' }
    expect(copyPatch(row, columns, 2)).toEqual({ when: '2026-11-05' })
    const full = { ...row, starts: '2026-11-03T09:00', ends: '2026-11-03T09:15' }
    expect(copyPatch(full, columns, 2)).toEqual({
      when: '2026-11-05',
      starts: '2026-11-05T09:00',
      ends: '2026-11-05T09:15',
    })
  })

  test('a date with nothing in it copies nothing', () => {
    expect(copyPatch({ id: 'r1', when: null }, columns, 1)).toEqual({})
  })
})

describe('copyAction', () => {
  const spec = (rank: 'number' | 'text'): TableSpec => ({
    name: 'events',
    columns: [
      { name: 'title', type: 'text' },
      { name: 'rank', type: rank },
    ],
  })

  test('one table.copy of the row, an entry per new row', () => {
    expect(copyAction('events', 'r1', [{ when: '2026-11-04' }], null)).toEqual({
      verb: 'table.copy',
      table: 'events',
      where: [{ column: 'id', op: 'eq', value: 'r1' }],
      set: {},
      each: [{ when: '2026-11-04' }],
    })
    expect(copyAction('events', 'r1', [], null).each).toEqual([{}])
  })

  test("a board's numeric rank is left for the copy to earn; a text rank is the row's own", () => {
    expect(copyAction('events', 'r1', [{}], spec('number')).set).toEqual({ rank: null })
    expect(copyAction('events', 'r1', [{}], spec('text')).set).toEqual({})
  })
})

describe('repeat words', () => {
  test('says how many, which days and the hours', () => {
    const plan = copyDates('2026-11-02T10:00/2026-11-02T11:00', '2026-11-06', EVERY_DAY)
    expect(repeatWords(plan, '10:00–11:00', 'en-GB')).toBe(
      'Adds 4 events: Tue 3 Nov – Fri 6 Nov, 10:00–11:00',
    )
    const one = copyDates('2026-11-02', '2026-11-03', EVERY_DAY)
    expect(repeatWords(one, null, 'en-GB')).toBe('Adds 1 event: Tue 3 Nov')
  })

  test('refuses in words past the limit or with no day', () => {
    expect(repeatWords(copyDates('2026-01-01', '2026-03-01', EVERY_DAY), null)).toContain(
      `more than ${AGENDA_COPY_LIMIT} events`,
    )
    expect(repeatWords(copyDates('2026-01-01', '2026-01-01', EVERY_DAY), null)).toContain(
      'No day matches',
    )
  })

  test('weekday chips follow the week start', () => {
    expect(weekdayChips('monday', 'en-US').map((chip) => chip.day)).toEqual([1, 2, 3, 4, 5, 6, 0])
    expect(weekdayChips('sunday', 'en-US').map((chip) => chip.label)[0]).toBe('Sun')
  })
})
