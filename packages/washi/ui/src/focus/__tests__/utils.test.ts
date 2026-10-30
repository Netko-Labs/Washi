import { describe, expect, test } from 'bun:test'
import { wrapIndex } from '../utils'

describe('Tab stays inside a modal', () => {
  test('at an edge it goes around', () => {
    expect(wrapIndex(3, 2, false)).toBe(0)
    expect(wrapIndex(3, 0, true)).toBe(2)
    expect(wrapIndex(1, 0, false)).toBe(0)
    expect(wrapIndex(1, 0, true)).toBe(0)
  })

  test('in the middle the browser moves it', () => {
    expect(wrapIndex(3, 0, false)).toBeNull()
    expect(wrapIndex(3, 1, true)).toBeNull()
  })

  test('focus that slipped outside comes back to an end', () => {
    expect(wrapIndex(3, -1, false)).toBe(0)
    expect(wrapIndex(3, -1, true)).toBe(2)
  })

  test('nothing to land on is the box’s to hold', () => {
    expect(wrapIndex(0, -1, false)).toBeNull()
  })
})
