import type { SearchHit, SheetMetaPatch, SheetSummary } from '@washi/domain'
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
  /** Optimistic like a move: the sidebar and header change before the server answers. */
  updateMeta: (id: string, patch: SheetMetaPatch) => Promise<void>
  /** A copy below the original, opened in a tab. */
  duplicateSheet: (id: string) => Promise<void>
  /** Takes back Washi's last write on the page. */
  undoWashi: (id: string) => Promise<void>
  search: (term: string) => Promise<void>
  reset: () => void
}
