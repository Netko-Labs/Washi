import { useEffect } from 'react'
import { SUGGESTIONS_POLL_MS } from '../constants'
import { useSuggestionsStore } from '../suggestions-store'

export function useSuggestionsPoll(workspaceId: string) {
  useEffect(() => {
    const check = () =>
      void useSuggestionsStore
        .getState()
        .refreshCount()
        .catch(() => {})
    check()
    const timer = setInterval(check, SUGGESTIONS_POLL_MS)
    return () => clearInterval(timer)
  }, [workspaceId])
}
