import { STATUS_BUSY_POLL_MS, STATUS_IDLE_POLL_MS } from './constants'
import type { AgentActivityWire } from './types'

export function statusPollMs(status: AgentActivityWire | null): number {
  return status?.state === 'working' || status?.state === 'needs_you'
    ? STATUS_BUSY_POLL_MS
    : STATUS_IDLE_POLL_MS
}
