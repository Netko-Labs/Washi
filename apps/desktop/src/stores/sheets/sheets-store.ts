import type { SearchHit, SheetSummary } from '@washi/domain'
import { create } from 'zustand'
import { api } from '@/lib/rpc'

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
}

/**
 * The scaffold is a product surface, not a stub (spec Q15): primitives carry no
 * styling, so a bare <H1> would open as unstyled HTML. This is a composed sheet
 * the agent can edit — and a worked example of the vocabulary while it does.
 */
const NEW_SHEET_SOURCE = (title: string) =>
  `<Sheet title=${JSON.stringify(title)} class="min-h-full bg-background px-8 py-12 text-foreground @md:px-16">
  <Box class="mx-auto max-w-2xl">
    <H1 class="font-display font-black text-4xl tracking-tight">${title}</H1>
    <P class="mt-4 text-[17px] text-muted-foreground leading-relaxed">
      Blank canvas. Ask the agent to design this page, or describe what it should hold.
    </P>
    <Divider class="my-8 border-border" />
    <P class="text-muted-foreground text-sm">
      Every block here is styled by this sheet — nothing is inherited.
    </P>
  </Box>
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
    const { useViewStore } = await import('@/stores/view/view-store')
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
}))
