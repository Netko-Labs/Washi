import { describe, expect, test } from 'bun:test'
import { isEmoji } from '../lib'

describe('isEmoji', () => {
  test('tells a picked emoji from a registry name', () => {
    expect(isEmoji('🌱')).toBe(true)
    expect(isEmoji('🧑‍💻')).toBe(true)
    expect(isEmoji('notebook')).toBe(false)
  })
})
