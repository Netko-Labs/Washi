import type { WorkspaceSummary } from '@/lib/types'

export interface ConsentState {
  clientName: string | null
  workspaces: WorkspaceSummary[]
  /** The workspaces ticked, in the list's order; the first is the agent's default (D124). */
  chosen: string[]
  busy: boolean
  error: string | null
}

export interface ConsentPageProps {
  clientId: string | null
}
