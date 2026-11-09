import { describe, expect, test } from 'bun:test'
import {
  clockChoices,
  clockLabel,
  durationWords,
  readWhen,
  withDay,
  withoutTime,
  withStart,
  withTime,
  writeWhen,
} from '../clock'

describe('a date cell with hours', () => {
  test('reads apart and writes back as the column stores it', () => {
    const cell = '2026-11-10T10:00/2026-11-10T11:30'
    const when = readWhen(cell)
    expect(when).toEqual({
      day: '2026-11-10',
      time: '10:00',
      endDay: '2026-11-10',
      endTime: '11:30',
    })
    expect(writeWhen(when)).toBe(cell)
    expect(writeWhen(readWhen('2026-11-10'))).toBe('2026-11-10')
    expect(writeWhen(readWhen('2026-11-10/2026-11-12'))).toBe('2026-11-10/2026-11-12')
    expect(writeWhen(readWhen(null))).toBeNull()
  })

  test('a timed end on the same day needs no end day, and never ends before it starts', () => {
    expect(writeWhen({ day: '2026-11-10', time: '10:00', endDay: null, endTime: '11:00' })).toBe(
      '2026-11-10T10:00/2026-11-10T11:00',
    )
    expect(writeWhen({ day: '2026-11-10', time: '10:00', endDay: null, endTime: '09:00' })).toBe(
      '2026-11-10T10:00',
    )
  })

  test('+ Add time is 09:00 for an hour; × makes the day whole again', () => {
    const timed = withTime(readWhen('2026-11-10'))
    expect(writeWhen(timed)).toBe('2026-11-10T09:00/2026-11-10T10:00')
    expect(writeWhen(withoutTime(timed))).toBe('2026-11-10')
    // A span of days keeps its last day; the hour lands on it.
    expect(writeWhen(withTime(readWhen('2026-11-10/2026-11-12')))).toBe(
      '2026-11-10T09:00/2026-11-12T10:00',
    )
  })

  test('a new start keeps the length, past midnight too', () => {
    const when = readWhen('2026-11-10T10:00/2026-11-10T11:30')
    expect(writeWhen(withStart(when, '14:00'))).toBe('2026-11-10T14:00/2026-11-10T15:30')
    expect(writeWhen(withStart(when, '23:30'))).toBe('2026-11-10T23:30/2026-11-11T01:00')
  })

  test('a new day carries the span with it', () => {
    expect(writeWhen(withDay(readWhen('2026-11-10/2026-11-12'), '2026-11-20'))).toBe(
      '2026-11-20/2026-11-22',
    )
    expect(writeWhen(withDay(readWhen('2026-11-10T10:00/2026-11-10T11:00'), '2026-11-11'))).toBe(
      '2026-11-11T10:00/2026-11-11T11:00',
    )
  })

  test('the hours list reads the reader’s way, and an end’s list says how long', () => {
    expect(clockLabel('14:30', 'en-US')).toBe('2:30 PM')
    expect(clockLabel('14:30', 'en-GB')).toBe('14:30')
    expect(clockChoices('en-GB')).toHaveLength(96)
    const ends = clockChoices('en-GB', '10:00')
    expect(ends[0]).toEqual({ value: '10:15', label: '10:15 (15 min)' })
    expect(ends.find((choice) => choice.value === '11:30')?.label).toBe('11:30 (1 hr 30 min)')
    expect(clockChoices('en-GB', null, '10:05').some((choice) => choice.value === '10:05')).toBe(
      true,
    )
    expect(durationWords(120)).toBe('2 hrs')
  })
})
