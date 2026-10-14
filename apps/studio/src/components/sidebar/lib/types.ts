import type { Icon } from '@tabler/icons-react'
import type { SheetSummary } from '@washi/domain'
import type { TabKey } from '@washi/ui'
import type { WorkspaceSummary } from '@/lib/types'

export type Theme = 'light' | 'dark'

export interface NavEntry {
  tab: TabKey
  label: string
  icon: Icon
}

export interface SidebarProps {
  workspace: WorkspaceSummary
  open: boolean
  onClose: () => void
}

export interface SidebarSectionProps {
  workspaceId: string
  onNavigate: () => void
}

export interface SidebarPageRowProps extends SidebarSectionProps {
  sheet: SheetSummary
}
