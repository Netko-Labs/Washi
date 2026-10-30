import { describe, expect, test } from 'bun:test'
import { RECENT_EMOJI_LIMIT } from '../constants'
import {
  emojiCatalog,
  emojiName,
  matchesQuery,
  searchEmoji,
  shortcodeNote,
  toShortcode,
  withRecent,
} from '../utils'

describe('the Unicode set', () => {
  test('every group unpacks, with no skin-tone variants and no duplicates', () => {
    const catalog = emojiCatalog()
    expect(catalog.map((category) => category.id)).toEqual([
      'smileys',
      'people',
      'nature',
      'food',
      'travel',
      'activities',
      'objects',
      'symbols',
      'flags',
    ])
    const all = catalog.flatMap((category) => category.entries.map((entry) => entry.emoji))
    expect(all.length).toBeGreaterThan(1800)
    expect(new Set(all).size).toBe(all.length)
    expect(all.some((emoji) => /[\u{1F3FB}-\u{1F3FF}]/u.test(emoji))).toBe(false)
    expect(emojiName('🦊')).toBe('fox')
  })

  test('a search matches word starts of the name or its subgroup', () => {
    expect(matchesQuery('red heart heart', 'red he')).toBe(true)
    expect(matchesQuery('red heart heart', 'art')).toBe(false)
    expect(searchEmoji('fox', 10).map((entry) => entry.emoji)).toContain('🦊')
    expect(searchEmoji('japan', 10).map((entry) => entry.emoji)).toContain('🇯🇵')
    expect(searchEmoji('fruit', 100).length).toBeGreaterThan(10)
  })
})

describe('shortcodes and recents', () => {
  test('a file name or a typed name becomes what the server accepts', () => {
    expect(toShortcode('Party Fox.PNG')).toBe('party-fox')
    expect(toShortcode('  ok_hand+1 ')).toBe('ok_hand+1')
  })

  test('a name the server would change says so as it is typed', () => {
    expect(shortcodeNote('zznight日本語 ZZ!')).toBe(
      'Lowercase letters, digits, - _ and + only — this becomes :zznight-zz:',
    )
    expect(shortcodeNote(':party-fox:')).toBeNull()
    expect(shortcodeNote('日本語')).toContain('none of what you typed is kept')
    expect(shortcodeNote('')).toBeNull()
  })

  test('the newest pick leads, once, and the row stays short', () => {
    expect(withRecent(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c'])
    const many = Array.from({ length: RECENT_EMOJI_LIMIT }, (_, index) => String(index))
    expect(withRecent(many, 'new')).toHaveLength(RECENT_EMOJI_LIMIT)
  })
})
