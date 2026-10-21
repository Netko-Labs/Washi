import { mascotStateFor, useAgentStore } from '@washi/ui'
import { useAgentStatus } from '@/components/agent-status'
import type { AskMood } from '../types'

/** One face and one tint for the field: the transcript's mood, unless Washi cannot think at all. */
export function useAskMood(): AskMood {
  const transcript = useAgentStore((state) => state.transcript)
  const running = useAgentStore((state) => state.running)
  const approvals = useAgentStore((state) => state.approvals)
  const status = useAgentStatus()
  const off = status?.state === 'asleep' || status?.state === 'paused'
  return {
    mascot: off ? 'resting' : mascotStateFor(transcript, running, approvals),
    status,
    tint: approvals.length > 0 ? 'need' : running ? 'busy' : off ? 'off' : 'none',
  }
}
