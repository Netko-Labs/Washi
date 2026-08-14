import { create } from 'zustand'
import { useSheetsStore } from '@/stores/sheets/sheets-store'

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
  onboarding: boolean
  finishOnboarding: () => void
  identity: Identity
  setIdentity: (patch: Partial<Identity>) => void
  dismissedReviews: string[]
  dismissReview: (id: string) => void
}

const ONBOARDED_KEY = 'washi.onboarded'
const IDENTITY_KEY = 'washi.identity'

function loadIdentity(): Identity {
  try {
    const stored = localStorage.getItem(IDENTITY_KEY)
    if (stored) return { name: '', email: '', color: '#cf6b36', ...JSON.parse(stored) }
  } catch {
    // fall through to defaults
  }
  return { name: 'Mira Kaneko', email: '', color: '#cf6b36' }
}

export function viewOf(tab: TabKey | null): AppView {
  if (!tab) return 'note'
  return tab.startsWith('note:') ? 'note' : (tab.slice(5) as AppView)
}

export function initials(name: string): string {
  return (name.trim() || 'M K')
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

  onboarding: localStorage.getItem(ONBOARDED_KEY) !== '1',
  finishOnboarding: () => {
    localStorage.setItem(ONBOARDED_KEY, '1')
    set({ onboarding: false })
  },

  identity: loadIdentity(),
  setIdentity: (patch) => {
    const identity = { ...get().identity, ...patch }
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity))
    set({ identity })
  },

  dismissedReviews: [],
  dismissReview: (id) => set((state) => ({ dismissedReviews: [...state.dismissedReviews, id] })),
}))
