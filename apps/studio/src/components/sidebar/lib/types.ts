import type { Icon } from '@tabler/icons-react'
import type { SheetSummary } from '@washi/domain'
import type { TabKey } from '@washi/ui'
import type { WorkspaceSummary } from '@/lib/types'

export type Theme = 'light' | 'dark'

export interface PlaceEntry {
  tab: TabKey
  label: string
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
}

export interface MobileHomeProps {
  workspace: WorkspaceSummary
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
