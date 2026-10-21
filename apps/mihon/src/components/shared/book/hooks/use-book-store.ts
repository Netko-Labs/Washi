import { create } from 'zustand'
import type { BookStore } from '../types'
import { BOOK_DEFAULTS } from '../values'

export const useBookStore = create<BookStore>((set) => ({
  ...BOOK_DEFAULTS,
  pick: (primitive) =>
    set((state) => ({
      primitive,
      knobs: {},
      childrenText: null,
      scratch: null,
      view: state.view === 'scratch' ? 'single' : state.view,
    })),
  setKnob: (key, value) =>
    set((state) => {
      const knobs = { ...state.knobs }
      if (value === undefined) delete knobs[key]
      else knobs[key] = value
      return { knobs }
    }),
  setChildren: (childrenText) => set({ childrenText }),
  setScratch: (scratch) => set({ scratch }),
  set: (patch) => set(patch),
  reset: () => set({ knobs: {}, childrenText: null, scratch: null }),
}))
