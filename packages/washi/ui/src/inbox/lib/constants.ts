import type { InboxFilter } from './types'

export const FILTER_LABELS: Record<InboxFilter, string> = {
  all: 'All',
  needs: 'Needs you',
  mentions: 'Mentions',
  washi: 'Washi',
}

export const DAY_MS = 86_400_000
