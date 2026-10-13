import type { ReactNode } from 'react'
import type { WorkspaceSummary } from '@/lib/types'

export interface FirstRunGateProps {
  workspace: WorkspaceSummary
  children: ReactNode
}

export interface FirstRunProps {
  workspace: WorkspaceSummary
  onDone: () => void
  onSkip: () => void
}
