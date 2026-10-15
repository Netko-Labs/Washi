import { describe, expect, test } from 'bun:test'
import { calendarOf, shift, spanOf, ticksOf, toIso } from '../lib'

const day = (iso: string) => spanOf(iso)?.start ?? Number.NaN

describe('roadmap dates', () => {
  test('a day or a start/end range becomes a span; anything else has no bar', () => {
    expect(spanOf('2026-10-01/2026-10-14')).toEqual({
      start: day('2026-10-01'),
      end: day('2026-10-14'),
    })
    expect(spanOf('2026-10-05')).toEqual({ start: day('2026-10-05'), end: day('2026-10-05') })
    expect(spanOf('soon')).toBeNull()
    expect(spanOf(null)).toBeNull()
  })

  test('dragging keeps the length: a range moves whole, a day stays a day', () => {
    const range = spanOf('2026-10-01/2026-10-14')
    const single = spanOf('2026-10-05')
    if (!range || !single) throw new Error('unparsed')
    expect(shift(range, 3)).toBe('2026-10-04/2026-10-17')
    expect(shift(single, -2)).toBe('2026-10-03')
  })

  test('the calendar holds every bar and today, with air, and at least four weeks', () => {
    const spans = [spanOf('2026-10-01/2026-10-14'), spanOf('2026-12-20')].flatMap((s) =>
      s ? [s] : [],
    )
    const calendar = calendarOf(spans, day('2026-10-10'))
    expect(toIso(calendar.first)).toBe('2026-09-28')
    expect(calendar.first + calendar.days - 1).toBe(day('2026-12-23'))
    expect(calendarOf([], day('2026-10-10')).days).toBe(28)
  })

  test('weekly ticks fall on Mondays', () => {
    const ticks = ticksOf({ first: day('2026-10-01'), days: 28 })
    expect(ticks.map((tick) => new Date(tick.day * 86_400_000).getUTCDay())).toEqual([1, 1, 1, 1])
  })
})
