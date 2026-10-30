import { create } from 'zustand'
import { api } from '@/integrations/trpc'
import type { SuggestionsState } from './types'

/** Read by the sidebar's Inbox count and the Inbox's suggestion rows (D120). */
export const useSuggestionsStore = create<SuggestionsState>((set, get) => ({
  unread: 0,
  items: [],
  refreshCount: async () => {
    set({ unread: await api.suggestions.unread.query() })
  },
  refresh: async () => {
    set(await api.suggestions.inbox.query())
  },
  approve: async (id) => {
    try {
      await api.suggestions.approve.mutate({ id })
    } finally {
      await get().refresh()
    }
  },
  decline: async (id) => {
    try {
      await api.suggestions.decline.mutate({ id })
    } finally {
      await get().refresh()
    }
  },
  markRead: async (ids) => {
    await api.suggestions.markRead.mutate({ ids })
    await get().refresh()
  },
  reset: () => set({ unread: 0, items: [] }),
}))
