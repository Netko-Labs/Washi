import type { SearchHit, SheetSummary } from '@washi/desktop-domain'
import { create } from 'zustand'
import { api } from '@/lib/rpc'

interface SheetsState {
  sheets: SheetSummary[]
  activeId: string | null
  searchTerm: string
  searchHits: SearchHit[]
  refresh: () => Promise<void>
  select: (id: string | null) => void
  createSheet: () => Promise<void>
  deleteSheet: (id: string) => Promise<void>
  search: (term: string) => Promise<void>
}

const NEW_SHEET_SOURCE = (title: string) =>
  `<Sheet title="${title}">\n  <H1>${title}</H1>\n  <P>Ask an agent to fill this in, or start writing.</P>\n</Sheet>\n`

export const useSheetsStore = create<SheetsState>((set, get) => ({
  sheets: [],
  activeId: null,
  searchTerm: '',
  searchHits: [],

  refresh: async () => {
    const sheets = await api.listSheets({})
    set((state) => ({
      sheets,
      activeId: state.activeId ?? sheets[0]?.id ?? null,
    }))
  },

  select: (id) => set({ activeId: id }),

  createSheet: async () => {
    const title = 'Untitled'
    const sheet = await api.createSheet({
      write: { title, source: NEW_SHEET_SOURCE(title) },
    })
    await get().refresh()
    set({ activeId: sheet.id })
  },

  deleteSheet: async (id) => {
    await api.deleteSheet({ id })
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
    const searchHits = await api.searchSheets({ term })
    set({ searchHits })
  },
}))
