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

/** Whether a page is the workspace's agent guide, and the press that flips it (D135). */
export interface AgentGuideState {
  /** Read yet: until then the row waits. */
  isKnown: boolean
  isGuide: boolean
  /** Why the last press did not land, in the server's words; the row reads the guide again. */
  error: string | null
  toggle: () => Promise<void>
}

export interface AgentGuideItemProps {
  sheet: SheetSummary
  className: string
  /** A menu's row (a checkbox to a screen reader); a phone's sheet has none. */
  role?: string
}
