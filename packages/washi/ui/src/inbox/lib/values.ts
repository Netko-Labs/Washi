import type { InboxFilter, StopReason } from './types'

/** A turn that came to no page and no words, by how it ended: `Washi <verb> <chat>`. */
export const TURN_LEFT: Record<StopReason, string> = {
  end_turn: 'worked in',
  max_tokens: 'ran out of room in',
  refusal: 'declined in',
  cancelled: 'was stopped in',
  error: 'ran into a problem in',
}

export const FILTER_LABELS: Record<InboxFilter, string> = {
  all: 'All',
  needs: 'Needs you',
  mentions: 'Mentions',
  washi: 'Washi',
}

/** What an empty chip says — only All speaks for the day. */
export const EMPTY_LABELS: Record<InboxFilter, string> = {
  all: 'Nothing in the last day.',
  needs: '',
  mentions: 'No mentions.',
  washi: 'Nothing from Washi in the last day.',
}
