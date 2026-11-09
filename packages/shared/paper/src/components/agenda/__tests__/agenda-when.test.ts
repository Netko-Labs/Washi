import { describe, expect, test } from 'bun:test'
import { eventPatch, eventWhen, eventWhenWords } from '../lib'

describe('an event’s card reads and writes its time where the agenda keeps it (D128)', () => {
  test('in its date, as a range', () => {
    const columns = { date: 'when' }
    const when = eventWhen({ id: 'a', when: '2026-11-10T10:00/2026-11-10T11:00' }, columns)
    expect(eventWhenWords(when, 'en-US')).toBe('Tuesday, November 10 · 10:00 AM – 11:00 AM')
    expect(eventPatch({ ...when, time: '15:00', endTime: '16:00' }, columns)).toEqual({
      when: '2026-11-10T15:00/2026-11-10T16:00',
    })
  })

  test('in time columns of its own, beside a bare day', () => {
    const columns = { date: 'day', time: 'starts', end: 'ends' }
    const when = eventWhen({ id: 'a', day: '2026-11-10', starts: '09:00', ends: '09:30' }, columns)
    expect(when).toEqual({ day: '2026-11-10', time: '09:00', endDay: null, endTime: '09:30' })
    expect(eventPatch({ ...when, day: '2026-11-11', time: null, endTime: null }, columns)).toEqual({
      day: '2026-11-11',
      starts: null,
      ends: null,
    })
  })

  test('a whole day, and a span of days', () => {
    expect(eventWhenWords(eventWhen({ d: '2026-11-10' }, { date: 'd' }), 'en-US')).toBe(
      'Tuesday, November 10',
    )
    expect(eventWhenWords(eventWhen({ d: '2026-11-10/2026-11-12' }, { date: 'd' }), 'en-US')).toBe(
      'Tuesday, November 10 – Thursday, November 12',
    )
  })
})
