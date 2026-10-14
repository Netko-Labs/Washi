import { create } from 'zustand'
import { useSheetsStore } from '../sheets/sheets-store'

export type AppView = 'note' | 'dashboard' | 'inbox' | 'daily' | 'settings'
export type TabKey = `note:${string}` | `view:${Exclude<AppView, 'note'>}`

export interface Identity {
  name: string
  email: string
  color: string
}

interface ViewState {
  tabs: TabKey[]
  activeTab: TabKey | null
  openTab: (key: TabKey) => void
  closeTab: (key: TabKey) => void
  closeAll: () => void
  identity: Identity
  setIdentity: (patch: Partial<Identity>) => void
}

export function viewOf(tab: TabKey | null): AppView {
  if (!tab) return 'note'
  return tab.startsWith('note:') ? 'note' : (tab.slice(5) as AppView)
}

export function initials(name: string): string {
  return (name.trim() || '?')
    .split(/\s+/)
    .map((word) => word[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export const useViewStore = create<ViewState>((set, get) => ({
  tabs: [],
  activeTab: null,

  openTab: (key) => {
    set((state) => ({
      tabs: state.tabs.includes(key) ? state.tabs : [...state.tabs, key],
      activeTab: key,
    }))
    if (key.startsWith('note:')) {
      useSheetsStore.getState().select(key.slice(5))
    }
  },

  closeTab: (key) => {
    const { tabs, activeTab } = get()
    const index = tabs.indexOf(key)
    const next = tabs.filter((tab) => tab !== key)
    const nextActive = activeTab === key ? (next[Math.max(0, index - 1)] ?? null) : activeTab
    set({ tabs: next, activeTab: nextActive })
    if (nextActive?.startsWith('note:')) {
      useSheetsStore.getState().select(nextActive.slice(5))
    }
  },

  closeAll: () => set({ tabs: [], activeTab: null }),

  // The host says who is here: the desktop from its profile, the web from the session.
  identity: { name: '', email: '', color: '#c25f2c' },
  setIdentity: (patch) => set((state) => ({ identity: { ...state.identity, ...patch } })),
}))
