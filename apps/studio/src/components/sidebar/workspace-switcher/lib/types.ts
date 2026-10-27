import type { RefObject } from 'react'
import type { WorkspaceSummary } from '@/lib/types'
import type { MenuPlacement } from '../../lib'

export interface WorkspaceSwitcherProps {
  workspace: WorkspaceSummary
  onNavigate: () => void
  /** The mark alone, menu below — the Home screen's top-left corner. */
  compact?: boolean
}

export interface WorkspaceMenuProps {
  anchor: RefObject<HTMLElement | null>
  currentId: string
  onClose: () => void
  placement?: MenuPlacement
}
