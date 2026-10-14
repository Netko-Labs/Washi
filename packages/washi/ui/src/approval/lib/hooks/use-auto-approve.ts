import { useAgentStore } from '../../../stores'

/** One switch, two places (chat and settings): the store holds it, so they never disagree. */
export function useAutoApprove() {
  const on = useAgentStore((state) => state.autoApprove)
  const toggle = async () => {
    if (on === null) return
    await useAgentStore.getState().setAutoApprove(!on)
  }
  return { on, toggle }
}
