import { create } from 'zustand'
import { auth } from '@/integrations/auth'
import { api } from '@/integrations/trpc'
import type { CommentsState } from './types'

const message = (cause: unknown) => (cause instanceof Error ? cause.message : String(cause))

/** The open page's discussion: the header button, the chrome and the Inbox all open it. */
export const useCommentsStore = create<CommentsState>((set, get) => ({
  isOpen: false,
  sheetId: null,
  comments: [],
  members: [],
  error: null,

  open: (sheetId) => {
    set({ isOpen: true })
    if (get().sheetId !== sheetId) void get().load(sheetId)
  },
  close: () => set({ isOpen: false }),
  toggle: (sheetId) => (get().isOpen ? get().close() : get().open(sheetId)),

  load: async (sheetId) => {
    set({ sheetId, comments: get().sheetId === sheetId ? get().comments : [], error: null })
    try {
      const comments = await api.comments.list.query({ sheetId })
      if (get().sheetId === sheetId) set({ comments })
      void api.comments.markRead.mutate({ sheetId })
    } catch (cause) {
      set({ error: message(cause) })
    }
  },

  loadMembers: async (workspaceId) => {
    const result = await auth.organization.getFullOrganization({
      query: { organizationId: workspaceId },
    })
    const members = result.data?.members ?? []
    set({ members: members.map((member) => ({ id: member.userId, name: member.user.name })) })
  },

  post: async (write) => {
    try {
      await api.comments.post.mutate(write)
      await get().load(write.sheetId)
      return true
    } catch (cause) {
      set({ error: message(cause) })
      return false
    }
  },

  resolve: async (threadId, resolved) => {
    await api.comments.resolve.mutate({ threadId, resolved })
    const { sheetId } = get()
    if (sheetId) await get().load(sheetId)
  },

  remove: async (id) => {
    await api.comments.remove.mutate({ id })
    const { sheetId } = get()
    if (sheetId) await get().load(sheetId)
  },

  reset: () => set({ isOpen: false, sheetId: null, comments: [], members: [], error: null }),
}))
