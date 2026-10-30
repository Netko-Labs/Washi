import { type InboxRow, useViewStore } from '@washi/ui'
import { useEffect, useMemo } from 'react'
import { useSuggestionsStore } from '../suggestions-store'
import type { SuggestionActions } from '../types'
import { rowOf } from '../utils'

const ACTIONS: SuggestionActions = {
  open: (suggestion) => {
    void useSuggestionsStore
      .getState()
      .markRead([suggestion.id])
      .catch(() => {})
    useViewStore.getState().openTab(`note:${suggestion.sheetId}`)
  },
  approve: (id) => useSuggestionsStore.getState().approve(id),
  decline: (id) => useSuggestionsStore.getState().decline(id),
}

/** Visitors' suggestions waiting on the reader's pages, shaped for the Inbox list (D120). */
export function useSuggestionRows(): InboxRow[] {
  const items = useSuggestionsStore((state) => state.items)
  useEffect(() => {
    void useSuggestionsStore
      .getState()
      .refresh()
      .catch(() => {})
  }, [])
  return useMemo(() => items.map((suggestion) => rowOf(suggestion, ACTIONS)), [items])
}
