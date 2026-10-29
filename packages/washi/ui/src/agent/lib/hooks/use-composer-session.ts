import { useShallow } from 'zustand/react/shallow'
import { useAgentStore } from '../../../stores'

export function useComposerSession() {
  return useAgentStore(
    useShallow((state) => ({
      running: state.running,
      session: state.sessions.find((s) => s.id === state.activeSessionId) ?? null,
    })),
  )
}
