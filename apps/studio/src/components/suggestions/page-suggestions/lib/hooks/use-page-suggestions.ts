import { useEffect, useMemo } from 'react'
import { useSuggestionsStore } from '../../../lib'
import type { Suggestion } from '../types'

/**
 * What visitors asked of this page through its link, still waiting (D120): read again when the
 * page opens and whenever the workspace's count moves. Seen here is seen — they are marked read,
 * so the Inbox stops counting what the page already showed.
 */
export function usePageSuggestions(sheetId: string): Suggestion[] {
  const items = useSuggestionsStore((state) => state.items)
  const unread = useSuggestionsStore((state) => state.unread)
  const mine = useMemo(() => items.filter((each) => each.sheetId === sheetId), [items, sheetId])

  useEffect(() => {
    void useSuggestionsStore
      .getState()
      .refresh()
      .catch(() => {})
  }, [sheetId, unread])

  useEffect(() => {
    const fresh = mine.filter((each) => !each.isRead).map((each) => each.id)
    if (fresh.length === 0) return
    void useSuggestionsStore
      .getState()
      .markRead(fresh)
      .catch(() => {})
  }, [mine])

  return mine
}
