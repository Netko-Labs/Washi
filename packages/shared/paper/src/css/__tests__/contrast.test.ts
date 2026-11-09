import { describe, expect, test } from 'bun:test'
import { pairings } from './contrast'

/**
 * Pairings below target that are known and owned elsewhere. Washi's orange is the brand's
 * (Netko-Labs/brand-assets): white on it is 4.02:1, a bold 13.5px button. Change it there.
 */
const KNOWN = new Set(['washi light words on the accent'])

describe('every colour paper draws reads in every theme, light and dark', () => {
  test('text at 4.5:1 and marks at 3:1, tints composited over the card they sit on', () => {
    const below = pairings()
      .filter((pairing) => pairing.ratio < pairing.need)
      .map((pairing) => `${pairing.theme} ${pairing.mode} ${pairing.what}`)
      .filter((key) => !KNOWN.has(key))
    expect(below).toEqual([])
  })

  test('the known exceptions are still below target, so none outlives its reason', () => {
    const still = pairings()
      .filter((pairing) => pairing.ratio < pairing.need)
      .map((pairing) => `${pairing.theme} ${pairing.mode} ${pairing.what}`)
    expect(still.filter((key) => KNOWN.has(key)).sort()).toEqual([...KNOWN].sort())
  })
})
