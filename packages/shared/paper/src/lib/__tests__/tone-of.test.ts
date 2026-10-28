import { describe, expect, test } from 'bun:test'
import { toneOf } from '../tone-of'

describe('toneOf', () => {
  test('a word with a meaning wears its tone, in any case', () => {
    expect(toneOf('High')).toBe('danger')
    expect(toneOf('in review')).toBe('warning')
  })

  test('an object key is not a meaning', () => {
    expect(toneOf('constructor')).toBeUndefined()
    expect(toneOf('toString')).toBeUndefined()
  })
})
