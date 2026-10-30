import { describe, expect, test } from 'bun:test'
import { type FollowChange, followsEnd, isAtEnd } from '../lib'

const scrolledUp: FollowChange = {
  isPinned: false,
  isNewChat: false,
  isOwnLast: false,
  length: 4,
  shownLength: 4,
}

describe('the panel follows its end only for a reader there', () => {
  test('a reader scrolled up stays put when a turn ends or Washi writes', () => {
    expect(followsEnd(scrolledUp)).toBe(false)
    expect(followsEnd({ ...scrolledUp, length: 5 })).toBe(false)
  })

  test('the person’s send follows once, as it lands — not on each turn change after', () => {
    expect(followsEnd({ ...scrolledUp, isOwnLast: true, length: 5, shownLength: 4 })).toBe(true)
    expect(followsEnd({ ...scrolledUp, isOwnLast: true, length: 5, shownLength: 5 })).toBe(false)
  })

  test('a reader at the end, or another chat, follows', () => {
    expect(followsEnd({ ...scrolledUp, isPinned: true })).toBe(true)
    expect(followsEnd({ ...scrolledUp, isNewChat: true })).toBe(true)
  })

  test('the end has a little slack', () => {
    expect(isAtEnd({ scrollHeight: 1000, scrollTop: 600, clientHeight: 400 })).toBe(true)
    expect(isAtEnd({ scrollHeight: 1000, scrollTop: 560, clientHeight: 400 })).toBe(true)
    expect(isAtEnd({ scrollHeight: 1000, scrollTop: 500, clientHeight: 400 })).toBe(false)
  })
})
