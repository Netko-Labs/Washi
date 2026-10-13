import type { AgentState } from './types'

export const STATE_LABEL: Record<AgentState, string> = {
  idle: 'Idle',
  working: 'Working',
  needs_you: 'Needs you',
  paused: 'Paused · daily stop',
  asleep: 'Asleep · no key',
}

/** Fills and dots only, never text. The signal colour is reserved for Washi asking. */
export const STATE_DOT: Record<AgentState, string> = {
  idle: 'bg-[#aebb9a]',
  working: 'bg-[#e8b36a] animate-pulse',
  needs_you: 'bg-primary',
  paused: 'bg-[#7f3f2c]',
  asleep: 'bg-muted-foreground/40',
}
