import { describe, expect, test } from 'bun:test'
import { ratioOf } from '../ratio'

describe('ratioOf', () => {
  test('a number or a numeric string is a share, held to 0–1', () => {
    expect(ratioOf(0.4, undefined, undefined)).toBe(0.4)
    expect(ratioOf('0.75', undefined, undefined)).toBe(0.75)
    expect(ratioOf(1.6, undefined, undefined)).toBe(1)
    expect(ratioOf(0, undefined, undefined)).toBe(0)
  })

  test('nothing real is null, never an invented 0', () => {
    expect(ratioOf('$row.done', undefined, undefined)).toBeNull()
    expect(ratioOf('', undefined, undefined)).toBeNull()
    expect(ratioOf(undefined, undefined, undefined)).toBeNull()
    expect(ratioOf(undefined, 'paid / total', null)).toBeNull()
    expect(ratioOf(undefined, 'paid / total', 0.5)).toBe(0.5)
  })
})
