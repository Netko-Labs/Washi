import type { WorkspaceSummary } from '@/lib/types'

export interface WorkspaceShellProps {
  workspace: WorkspaceSummary
  onLeave: () => void
}
