import { describe, expect, test } from 'bun:test'
import {
  busyOf,
  dayOf,
  isTaken,
  minutesOf,
  openingWeek,
  slotsOn,
  slotWords,
  weekdayOf,
} from '../lib'

const at = (moment: string) => minutesOf(moment) ?? 0

describe('free times to book (D102)', () => {
  test('a day’s hours cut into slots, the past left out and the booked marked', () => {
    const busy = busyOf(
      [{ when: '2026-10-29T10:00/2026-10-29T10:45' }, { when: '2026-10-29T13:00' }],
      'when',
      30,
    )
    const slots = slotsOn('2026-10-29', '09:00-14:00', 30, busy, at('2026-10-29T09:10'))
    const free = (slot: { isBooked: boolean }) => !slot.isBooked
    expect(slots.filter(free).map((slot) => slot.label)).toEqual([
      '09:30',
      '11:00',
      '11:30',
      '12:00',
      '12:30',
      '13:30',
    ])
    expect(slots.filter((slot) => slot.isBooked).map((slot) => slot.label)).toEqual([
      '10:00',
      '10:30',
      '13:00',
    ])
    expect(slots[3]).toEqual({
      start: '2026-10-29T11:00',
      end: '2026-10-29T11:30',
      label: '11:00',
      isBooked: false,
    })
  })

  test('a bare day takes the whole day; a slot never runs past closing', () => {
    const busy = busyOf([{ when: '2026-10-30' }], 'when', 30)
    expect(slotsOn('2026-10-30', '09:00-17:00', 30, busy, 0).every((slot) => slot.isBooked)).toBe(
      true,
    )
    expect(slotsOn('2026-10-31', '09:00-10:10', 30, [], 0).map((slot) => slot.label)).toEqual([
      '09:00',
      '09:30',
    ])
  })

  test('a week with nothing left by the clock opens on the next', () => {
    const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri'] as const
    const open = (moment: string, weekStart: 'monday' | 'sunday' = 'monday') =>
      openingWeek(at(moment), weekStart, [...weekdays], '09:00-17:00', 30)
    expect(open('2026-10-30T10:00')).toBe(0)
    expect(open('2026-10-30T16:40')).toBe(1)
    expect(open('2026-10-31T09:00')).toBe(1)
    expect(open('2026-11-01T09:00')).toBe(1)
    expect(open('2026-11-01T09:00', 'sunday')).toBe(0)
    expect(open('2026-10-26T20:00')).toBe(0)
  })

  test('a booked slot is said back in the reader’s words', () => {
    const slot = { start: '2026-11-03T10:00', end: '2026-11-03T10:30', label: '10:00' }
    expect(slotWords(slot, 'en-GB')).toBe('Tue 3 Nov, 10:00')
  })

  test('weekdays come off the day key, whatever the reader’s zone', () => {
    expect(weekdayOf('2026-10-29')).toBe('thu')
    expect(weekdayOf('2026-11-01')).toBe('sun')
  })
})

describe('the Slots spec', () => {
  test('hours that close before they open are refused in words', async () => {
    const { paperRegistry } = await import('../../../registry/specs')
    const spec = paperRegistry.components.Slots
    const base = { bind: { table: 'bookings' }, date: 'when' }
    expect(spec?.props.safeParse({ ...base, hours: '09:00-17:00' }).success).toBe(true)
    const reversed = spec?.props.safeParse({ ...base, hours: '17:00-09:00' })
    expect(reversed?.success).toBe(false)
    expect(JSON.stringify(reversed?.error?.issues)).toContain('open before they close')
  })
})

describe('a last look before booking', () => {
  const slot = { start: '2026-10-31T10:00', end: '2026-10-31T10:30', label: '10:00' }

  test('reads the slot’s own day, the month’s end included', () => {
    expect(dayOf(slot)).toEqual({ day: '2026-10-31', next: '2026-11-01' })
  })

  test('a row booked since the week was drawn takes the slot', () => {
    expect(isTaken(slot, [], 'when', 30)).toBe(false)
    expect(isTaken(slot, [{ when: '2026-10-31T10:15/2026-10-31T10:45' }], 'when', 30)).toBe(true)
    expect(isTaken(slot, [{ when: '2026-10-31T10:30' }], 'when', 30)).toBe(false)
    expect(isTaken(slot, [{ when: '2026-10-31' }], 'when', 30)).toBe(true)
  })
})
