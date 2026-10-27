import type { CustomEmoji } from '@washi/domain'

export type EmojiCategoryId =
  | 'smileys'
  | 'people'
  | 'nature'
  | 'food'
  | 'travel'
  | 'activities'
  | 'objects'
  | 'symbols'
  | 'flags'

export interface EmojiSource {
  id: EmojiCategoryId
  label: string
  /** `#subgroup words` lines, then `emoji name|emoji name` lines under each. */
  packed: readonly string[]
}

export interface EmojiEntry {
  emoji: string
  name: string
  /** The name and its Unicode subgroup, lowercased, what a search matches against. */
  words: string
}

export interface EmojiCategory {
  id: EmojiCategoryId
  label: string
  entries: EmojiEntry[]
}

export interface EmojiDraftState {
  name: string
  file: File | null
  busy: boolean
  error: string | null
}

export type CustomEmojiView = CustomEmoji
