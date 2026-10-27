import { create } from 'zustand'
import { api } from '@/integrations/trpc'
import type { RemindersState } from './types'

/** Read by the sidebar's Inbox count and the Inbox's reminder rows. */
export const useRemindersStore = create<RemindersState>((set, get) => ({
  unread: 0,
  items: [],
  refreshCount: async () => {
    set({ unread: await api.reminders.unread.query() })
  },
  refresh: async () => {
    set(await api.reminders.inbox.query())
  },
  markRead: async (hitIds) => {
    await api.reminders.markRead.mutate({ hitIds })
    await get().refresh()
  },
  reset: () => set({ unread: 0, items: [] }),
}))
