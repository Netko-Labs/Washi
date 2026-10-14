import type { ReactNode } from 'react'
import type { WorkspaceSummary } from '@/lib/types'

export interface WorkspaceShellProps {
  workspace: WorkspaceSummary
  children: ReactNode
}
