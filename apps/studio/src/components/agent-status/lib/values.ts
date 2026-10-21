import type { AgentState } from './types'

export const STATE_LABEL: Record<AgentState, string> = {
  idle: 'Idle',
  working: 'Working',
  needs_you: 'Needs you',
  paused: 'Paused · daily stop',
  asleep: 'Asleep · no key',
}
