import { useState } from 'react'
import { useSuggestionsStore } from '../../../lib'
import type { SuggestionDecide } from '../types'

/** Approve or Decline one request; a refusal (a time booked meanwhile, a changed table) stays. */
export function useSuggestionDecide(id: string): SuggestionDecide {
  const [busy, setBusy] = useState<SuggestionDecide['busy']>(null)
  const [error, setError] = useState<string | null>(null)

  const decide = async (how: 'approve' | 'decline') => {
    setBusy(how)
    setError(null)
    try {
      await useSuggestionsStore.getState()[how](id)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(null)
    }
  }

  return {
    busy,
    error,
    approve: () => void decide('approve'),
    decline: () => void decide('decline'),
  }
}
