import { create } from 'zustand'
import { api } from '../../api'
import type { WorkspaceLookState } from './types'

/** The workspace's default icon and cover (D139); the live feed refreshes it with the page list. */
export const useWorkspaceLookStore = create<WorkspaceLookState>((set) => ({
  icon: null,
  cover: null,
  refresh: async () => {
    const look = await api.workspaces.look.query().catch(() => null)
    if (look) set({ icon: look.icon, cover: look.cover })
  },
  reset: () => set({ icon: null, cover: null }),
}))
