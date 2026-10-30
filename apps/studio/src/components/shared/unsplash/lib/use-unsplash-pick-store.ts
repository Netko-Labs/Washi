import { create } from 'zustand'
import type { UnsplashPickState } from './types'

/** One photo asked for at a time, like a file picker: the press that asks waits on the answer. */
export const useUnsplashPickStore = create<UnsplashPickState>((set, get) => ({
  open: null,
  ask: (anchor) => {
    get().open?.settle(null)
    return new Promise((resolve) => {
      const settle = (photo: Parameters<typeof resolve>[0]) => {
        set({ open: null })
        resolve(photo)
      }
      set({ open: { anchor: { current: anchor }, settle } })
    })
  },
  dismiss: () => get().open?.settle(null),
}))
