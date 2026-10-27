import { useMemo, useState } from 'react'
import {
  type CustomEmojiView,
  EMOJI_SEARCH_LIMIT,
  type EmojiCategoryId,
  emojiCatalog,
  searchCustomEmoji,
  searchEmoji,
} from '@/components/shared/emoji'

/** One category on screen at a time, or, while a search is typed, whatever matches across all. */
export function useEmojiPanel(customs: CustomEmojiView[]) {
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState<EmojiCategoryId>('smileys')
  const isSearching = query.trim().length > 0

  const shown = useMemo(() => {
    if (!isSearching) {
      const category = emojiCatalog().find((entry) => entry.id === categoryId)
      return { category: category ?? { id: categoryId, label: '', entries: [] }, customs }
    }
    return {
      category: {
        id: categoryId,
        label: 'Results',
        entries: searchEmoji(query, EMOJI_SEARCH_LIMIT),
      },
      customs: searchCustomEmoji(customs, query),
    }
  }, [query, categoryId, customs, isSearching])

  return { query, setQuery, categoryId, setCategoryId, isSearching, ...shown }
}
