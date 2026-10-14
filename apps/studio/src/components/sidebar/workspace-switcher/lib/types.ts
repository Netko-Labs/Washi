import type { WorkspaceSummary } from '@/lib/types'

export interface WorkspaceSwitcherProps {
  workspace: WorkspaceSummary
  onNavigate: () => void
}

export interface WorkspaceMenuProps {
  currentId: string
  onClose: () => void
}

export interface NewWorkspaceFormProps {
  error: string | null
  onCreate: (name: string) => Promise<void>
}
