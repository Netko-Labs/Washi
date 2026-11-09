import type { Suggestion } from '@washi/domain'

export type { Suggestion }

export interface PageSuggestionsProps {
  sheetId: string
}

export interface PageSuggestionRowProps {
  suggestion: Suggestion
}

/** One request being decided: busy while it goes, a refusal said in the server's words. */
export interface SuggestionDecide {
  busy: 'approve' | 'decline' | null
  error: string | null
  approve: () => void
  decline: () => void
}
