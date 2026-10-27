import { create } from 'zustand'
import type { RowOpenerState } from './types'

/** Where a row opens: a host that peeks registers here; without one, a row opens as its tab. */
export const useRowOpenerStore = create<RowOpenerState>((set, get) => ({
  opener: null,
  register: (opener) => {
    set({ opener })
    return () => {
      if (get().opener === opener) set({ opener: null })
    }
  },
}))
