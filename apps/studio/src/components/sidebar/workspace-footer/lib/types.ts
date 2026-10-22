import type { RefObject } from 'react'
import type { WorkspaceSummary } from '@/lib/types'
import type { MenuPlacement } from '../../lib'

export interface WorkspaceFooterProps {
  workspace: WorkspaceSummary
  onNavigate: () => void
}

export interface UserMenuProps extends WorkspaceFooterProps {
  placement?: MenuPlacement
}

export interface MenuState {
  isOpen: boolean
  toggle: () => void
  close: () => void
  root: RefObject<HTMLDivElement | null>
}
