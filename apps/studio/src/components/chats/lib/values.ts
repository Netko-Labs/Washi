import type { ChatFilter } from './types'

export const CHAT_FILTERS: { id: ChatFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'routines', label: 'Routine runs' },
  { id: 'waiting', label: 'Waiting on you' },
]
