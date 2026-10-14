import type { SearchHit, SheetSummary } from '@washi/domain'
import { create } from 'zustand'
import { api } from '../../api'

interface SheetsState {
  sheets: SheetSummary[]
  activeId: string | null
  searchTerm: string
  searchHits: SearchHit[]
  paletteOpen: boolean
  openPalette: () => void
  closePalette: () => void
  refresh: () => Promise<void>
  select: (id: string | null) => void
  createSheet: () => Promise<void>
  deleteSheet: (id: string) => Promise<void>
  search: (term: string) => Promise<void>
  reset: () => void
}

/** A starter tree, not a stub: the agent edits a page that already reads as one. */
const NEW_SHEET_SOURCE = (title: string) =>
  `<Sheet title=${JSON.stringify(title)} icon="notebook" wsx="1">
  <Title>${title}</Title>
  <Text lead>Blank canvas. Ask the agent to design this page, or describe what it should hold.</Text>
  <Divider />
  <Text emphasis="quiet">Components own appearance; this page owns content and meaning.</Text>
</Sheet>
`

export const useSheetsStore = create<SheetsState>((set, get) => ({
  sheets: [],
  activeId: null,
  searchTerm: '',
  searchHits: [],
  paletteOpen: false,
  openPalette: () => set({ paletteOpen: true }),
  closePalette: () => set({ paletteOpen: false, searchTerm: '', searchHits: [] }),

  refresh: async () => {
    const sheets = await api.sheets.list.query()
    set((state) => ({
      sheets,
      activeId: state.activeId ?? sheets[0]?.id ?? null,
    }))
  },

  select: (id) => set({ activeId: id }),

  createSheet: async () => {
    const title = 'Untitled'
    const sheet = await api.sheets.create.mutate({
      write: { title, source: NEW_SHEET_SOURCE(title) },
    })
    await get().refresh()
    set({ activeId: sheet.id })
    const { useViewStore } = await import('../view/view-store')
    useViewStore.getState().openTab(`note:${sheet.id}`)
  },

  deleteSheet: async (id) => {
    await api.sheets.remove.mutate({ id })
    const { activeId } = get()
    await get().refresh()
    if (activeId === id) set({ activeId: get().sheets[0]?.id ?? null })
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

  reset: () =>
    set({ sheets: [], activeId: null, searchTerm: '', searchHits: [], paletteOpen: false }),
}))
