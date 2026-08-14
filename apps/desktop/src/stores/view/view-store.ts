import { create } from 'zustand'

export type AppView = 'note' | 'dashboard' | 'graph' | 'settings'

interface ViewState {
  view: AppView
  setView: (view: AppView) => void
  onboarding: boolean
  finishOnboarding: () => void
}

const ONBOARDED_KEY = 'washi.onboarded'

export const useViewStore = create<ViewState>((set) => ({
  view: 'note',
  setView: (view) => set({ view }),
  onboarding: localStorage.getItem(ONBOARDED_KEY) !== '1',
  finishOnboarding: () => {
    localStorage.setItem(ONBOARDED_KEY, '1')
    set({ onboarding: false })
  },
}))
