import { create } from 'zustand'
import { api } from '../../api'
import { applyPlacement } from '../../page-tree'
import type { SheetsState } from './types'

/** A blank page, as in Notion: an empty heading waiting for its name. */
const NEW_SHEET_SOURCE = (title: string) =>
  `<Sheet title=${JSON.stringify(title)} icon="notebook" wsx="1">
  <Title></Title>
</Sheet>
`

/** Bumped by reset: a list fetched for the last workspace must not land in this one. */
let generation = 0

export const useSheetsStore = create<SheetsState>((set, get) => ({
  sheets: [],
  activeId: null,
  searchTerm: '',
  searchHits: [],
  fresh: null,
  paletteOpen: false,
  openPalette: () => set({ paletteOpen: true }),
  closePalette: () => set({ paletteOpen: false, searchTerm: '', searchHits: [] }),

  refresh: async () => {
    const issued = generation
    const sheets = await api.sheets.list.query()
    if (issued !== generation) return
    set((state) => ({
      sheets,
      activeId: state.activeId ?? sheets[0]?.id ?? null,
    }))
  },

  select: (id) => set({ activeId: id }),

  createSheet: async (parentId = null) => {
    const title = 'Untitled'
    const sheet = await api.sheets.create.mutate({
      write: { title, source: NEW_SHEET_SOURCE(title) },
      parentId,
    })
    await get().refresh()
    set({ activeId: sheet.id, fresh: sheet.id })
    const { useViewStore } = await import('../view/view-store')
    useViewStore.getState().openTab(`note:${sheet.id}`)
  },

  takeFresh: (id) => {
    if (get().fresh !== id) return false
    set({ fresh: null })
    return true
  },

  deleteSheet: async (id) => {
    await api.sheets.remove.mutate({ id })
    const { activeId } = get()
    await get().refresh()
    if (activeId === id) set({ activeId: get().sheets[0]?.id ?? null })
  },

  moveSheet: async (id, placement) => {
    set({ sheets: applyPlacement(get().sheets, id, placement) })
    try {
      await api.sheets.move.mutate({ id, ...placement })
    } finally {
      await get().refresh()
    }
  },

  updateMeta: async (id, patch) => {
    set({
      sheets: get().sheets.map((sheet) =>
        sheet.id === id
          ? {
              ...sheet,
              ...(patch.title !== undefined && { title: patch.title }),
              ...(patch.icon !== undefined && { icon: patch.icon }),
              ...(patch.cover !== undefined && { cover: patch.cover }),
              ...(patch.fullWidth !== undefined && { fullWidth: patch.fullWidth }),
            }
          : sheet,
      ),
    })
    try {
      await api.sheets.updateMeta.mutate({ id, patch })
    } finally {
      await get().refresh()
    }
  },

  duplicateSheet: async (id) => {
    const copy = await api.sheets.duplicate.mutate({ id })
    await get().refresh()
    const { useViewStore } = await import('../view/view-store')
    useViewStore.getState().openTab(`note:${copy.id}`)
  },

  seedTeamSpace: async () => {
    const { backlog } = await api.tables.seedTeamSpace.mutate({
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
    await get().refresh()
    const { useViewStore } = await import('../view/view-store')
    useViewStore.getState().openTab(`note:${backlog}`)
  },

  undoWashi: async (id) => {
    try {
      await api.sheets.undoWashi.mutate({ id })
    } finally {
      await get().refresh()
    }
  },

  search: async (term) => {
    set({ searchTerm: term })
    if (!term.trim()) {
      set({ searchHits: [] })
      return
    }
    const searchHits = await api.sheets.search.query({ term })
    set({ searchHits })
  },

  reset: () => {
    generation += 1
    set({
      sheets: [],
      activeId: null,
      searchTerm: '',
      searchHits: [],
      fresh: null,
      paletteOpen: false,
    })
  },
}))
