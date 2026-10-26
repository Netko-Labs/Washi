import { create } from 'zustand'
import type { LookPickerState } from './types'

/** One picker at a time, opened by paper's icon and cover or by the band's add buttons. */
export const useLookPickerStore = create<LookPickerState>((set) => ({
  open: null,
  show: (part, anchor) => set({ open: { part, anchor } }),
  close: () => set({ open: null }),
}))
