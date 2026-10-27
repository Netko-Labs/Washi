import { create } from 'zustand'
import type { ShellState } from './types'

/** Read by the sidebar, the header's » button, the ⌘\ shortcut and, under `md`, the drawer. */
export const useShellStore = create<ShellState>((set) => ({
  folded: false,
  peeking: false,
  setFolded: (folded) => set({ folded, peeking: false }),
  toggleFold: () => set((state) => ({ folded: !state.folded, peeking: false })),
  setPeeking: (peeking) => set({ peeking }),
  drawer: false,
  setDrawer: (drawer) => set({ drawer }),
}))
