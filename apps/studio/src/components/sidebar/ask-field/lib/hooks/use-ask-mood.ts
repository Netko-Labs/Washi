import { mascotStateFor, useAgentStore } from '@washi/ui'
import { useShallow } from 'zustand/react/shallow'
import { useAgentStatus } from '@/components/agent-status'
import type { AskMood } from '../types'

/** One face and one tint for the field: the transcript's mood, unless Washi cannot think at all. */
export function useAskMood(): AskMood {
  const { mood, isAsking, running } = useAgentStore(
    useShallow((state) => ({
      mood: mascotStateFor(state.transcript, state.running, state.approvals, state.stalled),
      isAsking: state.approvals.length > 0,
      running: state.running,
    })),
  )
  const status = useAgentStatus()
  const off = status?.state === 'asleep' || status?.state === 'paused'
  return {
    mascot: off ? 'resting' : mood,
    status,
    tint: isAsking ? 'need' : running ? 'busy' : off ? 'off' : 'none',
  }
}
