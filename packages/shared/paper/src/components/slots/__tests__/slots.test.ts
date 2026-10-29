import { describe, expect, test } from 'bun:test'
import { busyOf, minutesOf, slotsOn, weekdayOf } from '../lib'

const at = (moment: string) => minutesOf(moment) ?? 0

describe('free times to book (D102)', () => {
  test('a day’s hours cut into slots, the booked and the past left out', () => {
    const busy = busyOf(
      [{ when: '2026-10-29T10:00/2026-10-29T10:45' }, { when: '2026-10-29T13:00' }],
      'when',
      30,
    )
    const slots = slotsOn('2026-10-29', '09:00-14:00', 30, busy, at('2026-10-29T09:10'))
    expect(slots.map((slot) => slot.label)).toEqual([
      '09:30',
      '11:00',
      '11:30',
      '12:00',
      '12:30',
      '13:30',
    ])
    expect(slots[1]).toEqual({ start: '2026-10-29T11:00', end: '2026-10-29T11:30', label: '11:00' })
  })

  test('a bare day takes the whole day; a slot never runs past closing', () => {
    const busy = busyOf([{ when: '2026-10-30' }], 'when', 30)
    expect(slotsOn('2026-10-30', '09:00-17:00', 30, busy, 0)).toEqual([])
    expect(slotsOn('2026-10-31', '09:00-10:10', 30, [], 0).map((slot) => slot.label)).toEqual([
      '09:00',
      '09:30',
    ])
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
