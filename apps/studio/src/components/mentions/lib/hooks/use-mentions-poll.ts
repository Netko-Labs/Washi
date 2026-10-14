import { useEffect } from 'react'
import { MENTIONS_POLL_MS } from '../constants'
import { useMentionsStore } from '../mentions-store'

export function useMentionsPoll(workspaceId: string) {
  useEffect(() => {
    const check = () =>
      void useMentionsStore
        .getState()
        .refreshCount()
        .catch(() => {})
    check()
    const timer = setInterval(check, MENTIONS_POLL_MS)
    return () => clearInterval(timer)
  }, [workspaceId])
}
