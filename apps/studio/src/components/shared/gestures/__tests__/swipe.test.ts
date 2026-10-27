import { describe, expect, test } from 'bun:test'
import { commits, isOwnGesture, travel } from '../utils'

describe('swipe', () => {
  test('a drag down is a downward swipe, a scroll sideways is not', () => {
    expect(isOwnGesture('y', 1, 4, 30)).toBe(true)
    expect(isOwnGesture('y', 1, 30, 4)).toBe(false)
    expect(isOwnGesture('y', 1, 0, -30)).toBe(false)
  })

  test('travel never goes against the direction that counts', () => {
    expect(travel('x', -1, -60, 3)).toBe(60)
    expect(travel('x', -1, 40, 3)).toBe(0)
  })

  test('far enough, or a short fast flick, commits', () => {
    expect(commits(120, 600, 100)).toBe(true)
    expect(commits(40, 50, 100)).toBe(true)
    expect(commits(40, 400, 100)).toBe(false)
    expect(commits(10, 5, 100)).toBe(false)
  })
})
