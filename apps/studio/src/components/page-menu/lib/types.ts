import type { SheetSummary } from '@washi/domain'

export type PageMenuMode = 'menu' | 'rename' | 'move'

export interface PageMenuProps {
  sheet: SheetSummary
}

export interface PageMenuPanelProps {
  sheet: SheetSummary
  onDone: () => void
}

export interface PageMenuListProps extends PageMenuPanelProps {
  onMode: (mode: PageMenuMode) => void
}
