import { describe, expect, test } from 'bun:test'
import { countdownOf, daysBetween, wallMoment } from '../lib'

const at = (moment: string) => wallMoment(moment).getTime()

describe('countdown', () => {
  test('days ahead, read on the reader’s own calendar', () => {
    expect(countdownOf('2026-12-24', at('2026-12-14T23:30'))).toEqual({
      when: 'ahead',
      figure: '10',
      unit: 'days',
    })
    expect(countdownOf('2026-12-24', at('2026-12-23T08:00')).unit).toBe('day')
  })

  test('a moment under two days counts hours, then minutes', () => {
    expect(countdownOf('2026-12-24T18:00', at('2026-12-23T08:00'))).toEqual({
      when: 'ahead',
      figure: '34',
      unit: 'hours',
    })
    expect(countdownOf('2026-12-24T18:00', at('2026-12-24T17:15')).unit).toBe('minutes')
    expect(countdownOf('2026-12-24T18:00', at('2026-12-21T18:00')).figure).toBe('3')
  })

  test('the day itself is today, after it days ago', () => {
    expect(countdownOf('2026-12-24', at('2026-12-24T22:00')).when).toBe('today')
    expect(countdownOf('2026-12-24T09:00', at('2026-12-24T22:00')).figure).toBe('Today')
    expect(countdownOf('2026-12-24', at('2026-12-27T01:00'))).toEqual({
      when: 'past',
      figure: '3',
      unit: 'days ago',
    })
  })

  test('a day across a clock change is still one day', () => {
    expect(daysBetween(wallMoment('2026-03-07'), wallMoment('2026-03-09'))).toBe(2)
    expect(daysBetween(wallMoment('2026-10-24'), wallMoment('2026-10-26'))).toBe(2)
  })
})
