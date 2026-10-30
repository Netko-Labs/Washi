import { describe, expect, test } from 'bun:test'
import { followsEnd, isAtEnd } from '../lib'

describe('the panel follows its end only for a reader there', () => {
  test('a reader scrolled up stays put when a turn ends or Washi writes', () => {
    expect(followsEnd({ isPinned: false, isOwnSend: false, isNewChat: false })).toBe(false)
  })

  test('a reader at the end, their own send, or another chat follows', () => {
    expect(followsEnd({ isPinned: true, isOwnSend: false, isNewChat: false })).toBe(true)
    expect(followsEnd({ isPinned: false, isOwnSend: true, isNewChat: false })).toBe(true)
    expect(followsEnd({ isPinned: false, isOwnSend: false, isNewChat: true })).toBe(true)
  })

  test('the end has a little slack', () => {
    expect(isAtEnd({ scrollHeight: 1000, scrollTop: 600, clientHeight: 400 })).toBe(true)
    expect(isAtEnd({ scrollHeight: 1000, scrollTop: 560, clientHeight: 400 })).toBe(true)
    expect(isAtEnd({ scrollHeight: 1000, scrollTop: 500, clientHeight: 400 })).toBe(false)
  })
})
