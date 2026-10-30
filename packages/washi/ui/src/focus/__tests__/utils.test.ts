import { describe, expect, test } from 'bun:test'
import { menuStep, wrapIndex } from '../utils'

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

describe('arrows walk a menu', () => {
  test('down and up go around at the ends', () => {
    expect(menuStep(3, 0, 'ArrowDown')).toBe(1)
    expect(menuStep(3, 2, 'ArrowDown')).toBe(0)
    expect(menuStep(3, 0, 'ArrowUp')).toBe(2)
  })

  test('Home and End land on the ends', () => {
    expect(menuStep(3, 1, 'Home')).toBe(0)
    expect(menuStep(3, 1, 'End')).toBe(2)
  })

  test('from outside the items, down is the first and up the last', () => {
    expect(menuStep(3, -1, 'ArrowDown')).toBe(0)
    expect(menuStep(3, -1, 'ArrowUp')).toBe(2)
  })

  test('other keys and an empty menu are left alone', () => {
    expect(menuStep(3, 1, 'Enter')).toBeNull()
    expect(menuStep(0, -1, 'ArrowDown')).toBeNull()
  })
})
