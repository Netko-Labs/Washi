import { mascotStateFor, useAgentStore } from '../../../stores'

export function useAgentMood() {
  const transcript = useAgentStore((state) => state.transcript)
  const running = useAgentStore((state) => state.running)
  const approvals = useAgentStore((state) => state.approvals)
  return mascotStateFor(transcript, running, approvals)
}
