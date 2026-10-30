import type { Icon } from '@tabler/icons-react'
import type { SheetSummary } from '@washi/domain'
import type { WorkspaceSummary } from '@/lib/types'

export type PlaceId = 'home' | 'inbox' | 'chats' | 'routines'

export interface PlaceEntry {
  id: PlaceId
  label: string
  title: string
  icon: Icon
}

export interface RecentEntry {
  id: string
  at: number
}

export interface RecentSheet {
  sheet: SheetSummary
  age: string
}

export type MenuPlacement = 'up' | 'down'

export interface SidebarProps {
  workspace: WorkspaceSummary
  folded: boolean
  peeking: boolean
  onFold: () => void
  onPeekEnd: () => void
  /** A phone's menu: the whole screen, ✕ instead of the fold, nothing remembered. */
  drawer?: boolean
}

export interface SidebarToggleProps {
  open: boolean
  onClick: () => void
  onPointerEnter?: () => void
}

export interface BackHomeProps {
  workspaceId: string
}

export interface SidebarSectionProps {
  workspaceId: string
  onNavigate: () => void
}

export interface SidebarPageRowProps extends SidebarSectionProps {
  sheet: SheetSummary
}

export interface RowMenuProps {
  sheet: SheetSummary
  onAddInside?: () => void
}
