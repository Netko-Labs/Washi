import { describe, expect, test } from 'bun:test'
import type { Row } from '../../../lib'
import { windowSlotsOn } from '../../slots/lib'
import { dayBlocks, hourRange, slotAt } from '../lib'

const columns = { date: 'when', title: 'title', show: 'show' }
const rows: Row[] = [
  { id: 'a', title: 'Sync', when: '2026-11-10T09:30/2026-11-10T10:30' },
  { id: 'b', title: 'Review', when: '2026-11-10T10:00/2026-11-10T11:30' },
  { id: 'c', title: 'Lunch', when: '2026-11-10T12:00/2026-11-10T13:00' },
  { id: 'd', title: 'Office hours', when: '2026-11-10T14:00/2026-11-10T17:00', show: 'Open' },
  { id: 'e', title: 'Focus', when: '2026-11-10T06:30/2026-11-10T07:30', show: 'Busy' },
  { id: 'f', title: 'Offsite', when: '2026-11-10' },
  { id: 'g', title: 'Night shift', when: '2026-11-09T22:00/2026-11-10T02:00' },
]

describe('a day of the time grid (D133)', () => {
  const day = dayBlocks(rows, columns, '2026-11-10')

  test('overlaps share their width in lanes; a lone block has it whole', () => {
    const lane = Object.fromEntries(
      day.timed.map((block) => [block.row.id, [block.lane, block.lanes]]),
    )
    expect(lane.a).toEqual([0, 2])
    expect(lane.b).toEqual([1, 2])
    expect(lane.c).toEqual([0, 1])
  })

  test('Open is a window behind, Busy is marked, a bare day goes on top', () => {
    expect(day.windows.map((block) => block.row.id)).toEqual(['d'])
    expect(day.timed.find((block) => block.row.id === 'e')?.isBusy).toBe(true)
    expect(day.allDay.map((row) => row.id)).toEqual(['f'])
  })

  test('a block over midnight is cut to the day and says it began before', () => {
    const night = day.timed.find((block) => block.row.id === 'g')
    expect(night).toMatchObject({ from: 0, to: 120, startsBefore: true, endsAfter: false })
  })

  test('the hours widen to whole hours so nothing falls off; a press seeds an hour', () => {
    expect(hourRange('08:00-20:00', [day])).toEqual({ from: 0, to: 20 * 60 })
    expect(slotAt('2026-11-10', { from: 8 * 60, to: 20 * 60 }, 48 * 2 + 30, 48)).toBe(
      '2026-11-10T10:30/2026-11-10T11:30',
    )
  })
})

describe('slots inside Open windows (D133)', () => {
  test('cut from the window’s own start, nothing outside it, the busy struck', () => {
    const at = (time: string) => Date.parse(`2026-11-10T${time}:00Z`) / 60_000
    const windows = [{ from: at('10:15'), to: at('12:00') }]
    const busy = [{ from: at('11:00'), to: at('11:30') }]
    const slots = windowSlotsOn('2026-11-10', windows, 30, busy, 0)
    expect(slots.map((slot) => [slot.label, slot.isBooked])).toEqual([
      ['10:15', false],
      ['10:45', true],
      ['11:15', true],
    ])
  })
})

describe('who takes time from booking (D133, D134)', () => {
  test('an Open window never; a whole day only as the page says, or when marked Busy', async () => {
    const { takesTime } = await import('../../../registry')
    const day = '2026-11-12'
    const timed = '2026-11-12T10:00/2026-11-12T11:00'
    expect(takesTime(timed, 'Open', { show: 'show' })).toBe(false)
    expect(takesTime(timed, undefined, { show: 'show' })).toBe(true)
    expect(takesTime(day, undefined, { show: 'show' })).toBe(true)
    expect(takesTime(day, undefined, { show: 'show', allDay: 'free' })).toBe(false)
    expect(takesTime(day, 'Busy', { show: 'show', allDay: 'free' })).toBe(true)
    expect(takesTime(timed, undefined, { show: 'show', allDay: 'free' })).toBe(true)
  })

  test('a card opens beside its event when it fits, else on the left; never on a phone', async () => {
    const { cardPlacement } = await import('../lib')
    const event = { top: 200, left: 300, right: 400, bottom: 260 }
    expect(cardPlacement(event, 300, { width: 1400, height: 900 })).toEqual({ top: 200, left: 408 })
    expect(
      cardPlacement({ ...event, left: 1100, right: 1200 }, 300, { width: 1400, height: 900 }),
    ).toEqual({
      top: 200,
      left: 632,
    })
    expect(cardPlacement({ ...event, top: 800 }, 300, { width: 1400, height: 900 })?.top).toBe(584)
    expect(cardPlacement(event, 300, { width: 400, height: 800 })).toBeNull()
  })
})
