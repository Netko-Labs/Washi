import type { PanelPlacement } from '@washi/ui'
import type { ReactNode } from 'react'
import type { WorkspaceSummary } from '@/lib/types'

export interface WorkspaceShellProps {
  workspace: WorkspaceSummary
  children: ReactNode
}

export interface AgentLayerProps {
  /** Float over the page, dock beside it, or fill a phone (D61). */
  placement?: PanelPlacement
}

export interface ShellState {
  folded: boolean
  /** Folded, but shown as an overlay while the pointer rests on the left edge or the » button. */
  peeking: boolean
  setFolded: (folded: boolean) => void
  toggleFold: () => void
  setPeeking: (peeking: boolean) => void
  /** Under `md`: the whole sidebar slid over the page from the ☰ button or the left edge. */
  drawer: boolean
  setDrawer: (drawer: boolean) => void
}

export interface FoldState {
  folded: boolean
  peeking: boolean
}

export interface MobileDrawerProps {
  workspace: WorkspaceSummary
}
