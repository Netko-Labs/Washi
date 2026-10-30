import type { Suggestion } from '@washi/domain'

export interface SuggestionsState {
  unread: number
  items: Suggestion[]
  refreshCount: () => Promise<void>
  refresh: () => Promise<void>
  /** Rejects in words: decided already, a booked time, a table that changed. */
  approve: (id: string) => Promise<void>
  decline: (id: string) => Promise<void>
  /** None named marks every suggestion the person sees. */
  markRead: (ids?: string[]) => Promise<void>
  reset: () => void
}

export interface SuggestionActions {
  open: (suggestion: Suggestion) => void
  approve: (id: string) => Promise<void>
  decline: (id: string) => Promise<void>
}
