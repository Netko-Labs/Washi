import { useNavigate, useRouterState } from '@tanstack/react-router'
import { AgentFab, AgentPanel, useAgentStore } from '@washi/ui'
import { chatPath } from '@/components/chats'
import type { AgentLayerProps } from './lib'

const CHAT_PAGE = /^\/w\/[^/]+\/chats\/[^/]+$/

/** On a chat's own page the chat is the page, so neither the door nor the room is drawn. */
export function AgentLayer({ fab = true, placement = 'float' }: AgentLayerProps) {
  const panelOpen = useAgentStore((state) => state.panelOpen)
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const navigate = useNavigate()
  if (CHAT_PAGE.test(pathname)) return null

  const expand = () => {
    const store = useAgentStore.getState()
    const workspaceId = pathname.split('/')[2] ?? ''
    store.togglePanel()
    void navigate({ to: chatPath(workspaceId, store.activeSessionId) })
  }

  return (
    <>
      {fab && (placement !== 'dock' || !panelOpen) && <AgentFab />}
      {panelOpen && <AgentPanel placement={placement} onExpand={expand} />}
    </>
  )
}
