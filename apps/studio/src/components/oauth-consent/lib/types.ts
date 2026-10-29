import type { WorkspaceSummary } from '@/lib/types'

export interface ConsentState {
  clientName: string | null
  workspaces: WorkspaceSummary[]
  chosen: string | null
  busy: boolean
  error: string | null
}

export interface ConsentPageProps {
  clientId: string | null
}
