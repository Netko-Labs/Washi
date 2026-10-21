import type { RefObject } from 'react'
import type { WorkspaceSummary } from '@/lib/types'

export interface WorkspaceFooterProps {
  workspace: WorkspaceSummary
  onNavigate: () => void
}

export interface MenuState {
  isOpen: boolean
  toggle: () => void
  close: () => void
  root: RefObject<HTMLDivElement | null>
}
