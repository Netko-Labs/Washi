import type { api } from '@/integrations/trpc'

export type AgentState = 'idle' | 'working' | 'needs_you' | 'paused' | 'asleep'

export interface AgentStatusView {
  state: AgentState
  costUsd: number
  savedUsd: number
  capUsd: number
  turns: number
}

export type AgentActivityWire = Awaited<ReturnType<typeof api.agents.status.query>>
