import { describe, expect, test } from 'bun:test'
import { pairings } from './contrast'

describe('every colour paper draws reads in every theme, light and dark', () => {
  test('text at 4.5:1 and marks at 3:1, tints composited over the card they sit on', () => {
    const below = pairings()
      .filter((pairing) => pairing.ratio < pairing.need)
      .map(
        (pairing) => `${pairing.theme} ${pairing.mode} ${pairing.what} ${pairing.ratio.toFixed(2)}`,
      )
    expect(below).toEqual([])
  })
})
