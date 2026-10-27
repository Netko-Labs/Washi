import type { EmojiSource } from '../types'
import { ACTIVITIES } from './activities'
import { FLAGS } from './flags'
import { FOOD } from './food'
import { NATURE } from './nature'
import { OBJECTS } from './objects'
import { PEOPLE } from './people'
import { SMILEYS } from './smileys'
import { SYMBOLS } from './symbols'
import { TRAVEL } from './travel'

/** Unicode's own groups, in its order; `bun scripts/emoji-values.ts` regenerates the data. */
export const EMOJI_SOURCES: readonly EmojiSource[] = [
  { id: 'smileys', label: 'Smileys & emotion', packed: SMILEYS },
  { id: 'people', label: 'People & body', packed: PEOPLE },
  { id: 'nature', label: 'Animals & nature', packed: NATURE },
  { id: 'food', label: 'Food & drink', packed: FOOD },
  { id: 'travel', label: 'Travel & places', packed: TRAVEL },
  { id: 'activities', label: 'Activities', packed: ACTIVITIES },
  { id: 'objects', label: 'Objects', packed: OBJECTS },
  { id: 'symbols', label: 'Symbols', packed: SYMBOLS },
  { id: 'flags', label: 'Flags', packed: FLAGS },
]
