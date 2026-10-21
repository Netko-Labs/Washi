import type { AgentMascotState } from '@washi/ui'
import type { AgentStatusView } from '@/components/agent-status'

export interface AskFieldProps {
  onNavigate: () => void
}

export interface AskMood {
  mascot: AgentMascotState
  status: AgentStatusView | null
  /** The field's border says what the mascot's face says, for a glance from across the room. */
  tint: 'none' | 'busy' | 'need' | 'off'
}
