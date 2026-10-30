import type { ReactNode } from 'react'
import type { WorkspaceSummary } from '@/lib/types'

export interface FirstRunGateProps {
  workspace: WorkspaceSummary
  children: ReactNode
}

export interface AsleepNoteProps {
  workspace: WorkspaceSummary
  onSkip: () => void
}

export interface FirstRunProps {
  workspace: WorkspaceSummary
  onDone: () => void
  onSkip: () => void
}
