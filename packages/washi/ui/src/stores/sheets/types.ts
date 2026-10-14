import type { SearchHit, SheetSummary } from '@washi/domain'
import type { PagePlacement } from '../../page-tree'

export interface SheetsState {
  sheets: SheetSummary[]
  activeId: string | null
  searchTerm: string
  searchHits: SearchHit[]
  paletteOpen: boolean
  openPalette: () => void
  closePalette: () => void
  refresh: () => Promise<void>
  select: (id: string | null) => void
  /** A new page, last under `parentId` (the top level when omitted), opened in a tab. */
  createSheet: (parentId?: string | null) => Promise<void>
  deleteSheet: (id: string) => Promise<void>
  /** Optimistic: the tree moves at once, the server's list replaces it when it answers. */
  moveSheet: (id: string, placement: PagePlacement) => Promise<void>
  search: (term: string) => Promise<void>
  reset: () => void
}
