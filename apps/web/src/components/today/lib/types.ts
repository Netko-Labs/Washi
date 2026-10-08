import type { api } from '@/lib/rpc'
import type { WorkspaceSummary } from '@/lib/types'

export type TodayWire = Awaited<ReturnType<typeof api.agents.today.query>>
export type TurnSummaryWire = TodayWire['turns'][number]
export type PendingWire = TodayWire['pending'][number]

export interface TodayViewProps {
  workspace: WorkspaceSummary
  onOpenAgent: () => void
}

export interface TodayTurnProps {
  turn: TurnSummaryWire
}

export interface NeedsYouProps {
  pending: PendingWire[]
  onDecide: (id: string, decision: 'allow_once' | 'reject_once') => void
}
