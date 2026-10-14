import { create } from 'zustand'
import { api } from '@/integrations/trpc'
import type { MentionsState } from './types'

/** Read by the sidebar's Inbox count and the Inbox's Mentions list. */
export const useMentionsStore = create<MentionsState>((set, get) => ({
  unread: 0,
  items: [],
  refreshCount: async () => {
    set({ unread: await api.comments.unreadMentions.query() })
  },
  // The list stops at 50; the count comes from the server so it never stops with it.
  refresh: async () => {
    const [items, unread] = await Promise.all([
      api.comments.mentions.query(),
      api.comments.unreadMentions.query(),
    ])
    set({ items, unread })
  },
  markRead: async (target) => {
    await api.comments.markRead.mutate(target)
    await get().refresh()
  },
  reset: () => set({ unread: 0, items: [] }),
}))
