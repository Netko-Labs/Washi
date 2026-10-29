import { describe, expect, test } from 'bun:test'
import { calendarOf, moved, rowSpan, shift, spanOf, ticksOf, toIso } from '../lib'

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
    expect(ticks.map((tick) => new Date(tick.day * 86_400_000).getUTCDay())).toEqual([1, 1, 1])
    // None in the last stretch, where a label would run off the edge.
    expect(Math.max(...ticks.map((tick) => tick.day))).toBeLessThan(day('2026-10-01') + 28 * 0.88)
  })
})

describe('a bar from a start column to a due column', () => {
  test('runs date → end, and a drag moves both', () => {
    const span = rowSpan({ start: '2026-10-20', due: '2026-11-14' }, 'start', 'due')
    expect(span && span.end - span.start).toBe(25)
    expect(span && moved(span, 2, 'start', 'due')).toEqual({
      start: '2026-10-22',
      due: '2026-11-16',
    })
    const range = rowSpan({ when: '2026-10-20/2026-10-24', due: null }, 'when', 'due')
    expect(range && moved(range, 1, 'when')).toEqual({ when: '2026-10-21/2026-10-25' })
    expect(rowSpan({ start: '2026-10-20', due: null }, 'start', 'due')).toEqual(
      rowSpan({ start: '2026-10-20' }, 'start'),
    )
  })
})
