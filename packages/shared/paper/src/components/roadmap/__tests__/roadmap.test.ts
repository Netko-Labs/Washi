import { describe, expect, test } from 'bun:test'
import { calendarOf, drawnOf, moved, placed, rowSpan, shift, spanOf, ticksOf, toIso } from '../lib'

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

describe('a far-off date', () => {
  const now = day('2026-10-10')
  const near = ['2026-09-01', '2026-10-01/2026-11-20', '2026-12-05'].map((iso) => spanOf(iso))
  const spans = [...near, spanOf('0001-01-01'), spanOf('9999-12-31')].flatMap((s) => (s ? [s] : []))

  test('holds the calendar to three years around the bulk of the rows', () => {
    const calendar = calendarOf(spans, now)
    expect(calendar.days).toBe(3 * 365 + 1)
    expect(calendar.first).toBeLessThanOrEqual(day('2026-09-01'))
    expect(calendar.first + calendar.days).toBeGreaterThan(day('2026-12-05'))
  })

  test('draws a few ticks, never one per day', () => {
    const calendar = calendarOf(spans, now)
    const ticks = ticksOf(calendar)
    expect(ticks.length).toBeLessThanOrEqual(12)
    expect(ticks.every((tick) => toIso(tick.day).slice(8) === '01')).toBe(true)
    const early = ticksOf({ first: day('0001-01-01'), days: 400 }).map((t) => toIso(t.day))
    expect(early.slice(0, 2)).toEqual(['0001-01-01', '0001-02-01'])
  })

  test('is cut at the edge it runs past', () => {
    const calendar = calendarOf(spans, now)
    const last = calendar.first + calendar.days - 1
    const past = spanOf('9999-12-31')
    const across = spanOf('0001-01-01/9999-12-31')
    if (!past || !across) throw new Error('unparsed')
    expect(drawnOf(past, calendar)).toEqual({ start: last, end: last, cut: 'end' })
    expect(drawnOf(across, calendar)).toEqual({ start: calendar.first, end: last, cut: 'both' })
    expect(drawnOf({ start: now, end: now }, calendar).cut).toBeUndefined()
  })

  test('only far-off rows: the calendar sits on them', () => {
    const late = ['9999-11-01', '9999-12-31'].flatMap((iso) => spanOf(iso) ?? [])
    const calendar = calendarOf(late, now)
    expect(calendar.first + calendar.days - 1).toBe(day('9999-12-31') + 3)
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

describe('placing a bar on a row with only an end', () => {
  const day = (iso: string) => spanOf(iso)?.start ?? 0

  test('a later end stays; an earlier one moves up to the start', () => {
    expect(placed(day('2026-10-05'), { due: '2026-10-20' }, 'start', 'due')).toEqual({
      start: '2026-10-05',
    })
    expect(placed(day('2026-10-25'), { due: '2026-10-20' }, 'start', 'due')).toEqual({
      start: '2026-10-25',
      due: '2026-10-25',
    })
    expect(placed(day('2026-10-25'), {}, 'start')).toEqual({ start: '2026-10-25' })
  })
})
