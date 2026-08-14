/** Static review queue + activity feed from the handoff — shared by Dashboard and Inbox. */

export interface ReviewItem {
  id: string
  title: string
  meta: string
}

export const REVIEWS: ReviewItem[] = [
  {
    id: 'nullbyte-scrollback',
    title: 'Nullbyte terminal — scrollback claim',
    meta: 'Suggested edit · 4 min ago',
  },
  {
    id: 'hearth-contrast',
    title: 'Hearth recipes — contrast fix on labels',
    meta: 'Draft awaiting review · 2 min ago',
  },
  {
    id: 'slab-tokens',
    title: 'SLAB marketplace — token conflicts',
    meta: 'Scheduled run flagged 3 components · 06:00',
  },
]

export const ACTIVITY: { text: string; when: string }[] = [
  { text: 'Suggested a scrollback rewrite in Nullbyte', when: '4 min ago' },
  { text: 'Flagged a contrast failure in Hearth labels', when: '2 hours ago' },
  { text: 'Scheduled run: token conflict audit on SLAB', when: '06:00' },
  { text: 'Linked 6 research pages as sources', when: 'yesterday' },
]
