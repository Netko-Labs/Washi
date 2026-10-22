import type { InboxFilter } from './types'

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
