import type { SheetSummary } from '@washi/domain'
import type { RefObject } from 'react'

export type PageMenuMode = 'menu' | 'rename' | 'move' | 'share' | 'theme'

export interface PageMenuState {
  mode: PageMenuMode | null
  setMode: (mode: PageMenuMode) => void
  toggle: () => void
  close: () => void
  root: RefObject<HTMLDivElement | null>
  trigger: RefObject<HTMLButtonElement | null>
  popover: RefObject<HTMLDivElement | null>
}

export interface PageMenuProps {
  sheet: SheetSummary
  /** A phone's header: comments, share, copy link and the star live in here instead of beside it. */
  compact?: boolean
}

export interface PageMenuPanelProps {
  sheet: SheetSummary
  onDone: () => void
}

export interface PageMenuListProps extends PageMenuPanelProps {
  onMode: (mode: PageMenuMode) => void
  compact?: boolean
}

export type PageMenuQuickProps = PageMenuListProps
