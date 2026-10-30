import { mascotStateFor, useAgentStore } from '../../../stores'

export function useAgentMood() {
  return useAgentStore((state) =>
    mascotStateFor(state.transcript, state.running, state.approvals, state.stalled),
  )
}
