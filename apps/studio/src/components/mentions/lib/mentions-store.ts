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
  refresh: async () => {
    const items = await api.comments.mentions.query()
    set({ items, unread: items.filter((item) => !item.isRead).length })
  },
  markRead: async (target) => {
    await api.comments.markRead.mutate(target)
    await get().refresh()
  },
  reset: () => set({ unread: 0, items: [] }),
}))
