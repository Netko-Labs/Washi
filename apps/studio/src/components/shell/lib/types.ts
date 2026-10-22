import type { ReactNode } from 'react'
import type { WorkspaceSummary } from '@/lib/types'

export interface WorkspaceShellProps {
  workspace: WorkspaceSummary
  children: ReactNode
}

export interface AgentLayerProps {
  /** The desktop-width door; under `md` the ask bar is the door and the FAB stays home. */
  fab?: boolean
}

export interface ShellState {
  folded: boolean
  /** Folded, but shown as an overlay while the pointer rests on the left edge or the » button. */
  peeking: boolean
  setFolded: (folded: boolean) => void
  toggleFold: () => void
  setPeeking: (peeking: boolean) => void
}

export interface FoldState {
  folded: boolean
  peeking: boolean
}
