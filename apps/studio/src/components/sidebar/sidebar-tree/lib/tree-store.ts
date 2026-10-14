import { create } from 'zustand'
import type { TreeState } from './types'

/** Which pages are open and what is being dragged — read by every row in the tree. */
export const useTreeStore = create<TreeState>((set, get) => ({
  expanded: [],
  draggingId: null,
  over: null,
  notice: null,
  toggle: (id) =>
    set(({ expanded }) => ({
      expanded: expanded.includes(id) ? expanded.filter((each) => each !== id) : [...expanded, id],
    })),
  expand: (ids) => {
    const missing = ids.filter((id) => !get().expanded.includes(id))
    if (missing.length > 0) set({ expanded: [...get().expanded, ...missing] })
  },
  startDrag: (id) => set({ draggingId: id, over: null, notice: null }),
  hover: (id, drop) => {
    const { over } = get()
    if (over?.id !== id || over.drop !== drop) set({ over: { id, drop } })
  },
  clearHover: () => {
    if (get().over) set({ over: null })
  },
  endDrag: () => set({ draggingId: null, over: null }),
  report: (notice) => set({ notice }),
}))
