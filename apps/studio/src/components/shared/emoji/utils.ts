import { RECENT_EMOJI_KEY_PREFIX, RECENT_EMOJI_LIMIT, SHORTCODE_MAX } from './constants'
import type { CustomEmojiView, EmojiCategory, EmojiEntry } from './types'
import { EMOJI_SOURCES } from './values'

let catalog: EmojiCategory[] | null = null
let names: Map<string, string> | null = null

/** Unpacked on first open, then kept: the picker never parses the set twice. */
export function emojiCatalog(): EmojiCategory[] {
  catalog ??= EMOJI_SOURCES.map((source) => {
    const entries: EmojiEntry[] = []
    let subgroup = ''
    for (const line of source.packed) {
      if (line.startsWith('#')) {
        subgroup = line.slice(1)
        continue
      }
      for (const item of line.split('|')) {
        const space = item.indexOf(' ')
        const name = item.slice(space + 1)
        entries.push({
          emoji: item.slice(0, space),
          name,
          words: `${name} ${subgroup}`.toLowerCase(),
        })
      }
    }
    return { id: source.id, label: source.label, entries }
  })
  return catalog
}

export function emojiName(emoji: string): string | null {
  names ??= new Map(
    emojiCatalog().flatMap((category) =>
      category.entries.map((entry) => [entry.emoji, entry.name]),
    ),
  )
  return names.get(emoji) ?? null
}

function wordsOf(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
}

/** Every word typed must start a word of the text: `red he` finds "red heart". */
export function matchesQuery(text: string, query: string): boolean {
  const haystack = ` ${wordsOf(text).join(' ')}`
  return wordsOf(query).every((word) => haystack.includes(` ${word}`))
}

/** Whole words of the name first, then word starts of it, then its subgroup; Unicode order within. */
export function searchEmoji(query: string, limit: number): EmojiEntry[] {
  const typed = wordsOf(query)
  if (typed.length === 0) return []
  const ranked: [EmojiEntry[], EmojiEntry[], EmojiEntry[]] = [[], [], []]
  for (const category of emojiCatalog()) {
    for (const entry of category.entries) {
      const name = wordsOf(entry.name)
      if (typed.every((word) => name.includes(word))) ranked[0].push(entry)
      else if (typed.every((word) => name.some((part) => part.startsWith(word)))) {
        ranked[1].push(entry)
      } else if (matchesQuery(entry.words, query)) ranked[2].push(entry)
    }
  }
  return ranked.flat().slice(0, limit)
}

export function searchCustomEmoji(emojis: CustomEmojiView[], query: string): CustomEmojiView[] {
  return emojis.filter((emoji) => matchesQuery(emoji.name, query))
}

/** What the server will accept, from whatever was typed or the file's name. */
export function toShortcode(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_+-]/g, '')
    .slice(0, SHORTCODE_MAX)
}

export function readRecentEmoji(personId: string): string[] {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(RECENT_EMOJI_KEY_PREFIX + personId) ?? '[]',
    )
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : []
  } catch {
    return []
  }
}

export function writeRecentEmoji(personId: string, list: string[]): void {
  try {
    localStorage.setItem(RECENT_EMOJI_KEY_PREFIX + personId, JSON.stringify(list))
  } catch {
    // private mode: Recent lasts the visit
  }
}

export function withRecent(list: string[], value: string): string[] {
  return [value, ...list.filter((entry) => entry !== value)].slice(0, RECENT_EMOJI_LIMIT)
}
