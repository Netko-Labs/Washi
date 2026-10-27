import { useNavigate } from '@tanstack/react-router'
import { useAgentStore } from '@washi/ui'
import { useEffect, useState } from 'react'
import { chatPath } from '../utils'

/**
 * The URL names the chat and the agent store holds it: the route picks it (or a blank one), and
 * once the store moves on — a first send creating it, + starting another — the URL follows.
 */
export function useChatRoute(workspaceId: string, chatId: string | undefined) {
  const navigate = useNavigate()
  const activeSessionId = useAgentStore((state) => state.activeSessionId)
  const [isMissing, setMissing] = useState(false)

  useEffect(() => {
    setMissing(false)
    const store = useAgentStore.getState()
    if (!chatId) {
      store.startDraft()
      return
    }
    if (store.activeSessionId === chatId) return
    store.selectSession(chatId).catch(() => setMissing(true))
  }, [chatId])

  // Read fresh: the effect above may have just picked this route's chat in the same commit.
  useEffect(() => {
    const current = useAgentStore.getState().activeSessionId
    if (!current || current !== activeSessionId || current === chatId) return
    void navigate({ to: chatPath(workspaceId, current), replace: true })
  }, [activeSessionId, chatId, workspaceId, navigate])

  return { isMissing }
}
