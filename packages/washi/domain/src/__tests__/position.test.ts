import { describe, expect, test } from 'bun:test'
import { positionBetween } from '../position'

function isSorted(keys: string[]): boolean {
  return keys.every((key, index) => index === 0 || (keys[index - 1] as string) < key)
}

describe('positionBetween', () => {
  test('appends and prepends stay ordered', () => {
    const appended = [positionBetween(null, null)]
    for (let i = 0; i < 200; i++) appended.push(positionBetween(appended.at(-1) ?? null, null))
    expect(isSorted(appended)).toBe(true)

    const prepended = [positionBetween(null, null)]
    for (let i = 0; i < 200; i++) prepended.unshift(positionBetween(null, prepended[0] ?? null))
    expect(isSorted(prepended)).toBe(true)
  })

  test('repeated inserts between two neighbours stay strictly between', () => {
    const low = positionBetween(null, null)
    let high = positionBetween(low, null)
    for (let i = 0; i < 200; i++) {
      const middle = positionBetween(low, high)
      expect(low < middle && middle < high).toBe(true)
      expect(middle.endsWith('0')).toBe(false)
      high = middle
    }
  })

  test('refuses a reversed pair', () => {
    expect(() => positionBetween('b', 'a')).toThrow()
  })
})
