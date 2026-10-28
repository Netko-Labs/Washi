import type { Tone } from './types'
import { VALUE_TONES } from './values'

/** The tone a word means, or none — own keys only, so "constructor" means nothing. */
export function toneOf(value: string): Tone | undefined {
  const key = value.toLowerCase()
  return Object.hasOwn(VALUE_TONES, key) ? VALUE_TONES[key] : undefined
}
