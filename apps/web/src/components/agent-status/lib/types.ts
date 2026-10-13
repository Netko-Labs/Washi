import type { api } from '@/lib/rpc'

export type AgentState = 'idle' | 'working' | 'needs_you' | 'paused' | 'asleep'

export interface AgentStatusView {
  state: AgentState
  costUsd: number
  savedUsd: number
  capUsd: number
  turns: number
}

export interface AgentStatusProps {
  onOpenAgent: () => void
  onOpenSettings: () => void
}

export type AgentActivityWire = Awaited<ReturnType<typeof api.agents.status.query>>
