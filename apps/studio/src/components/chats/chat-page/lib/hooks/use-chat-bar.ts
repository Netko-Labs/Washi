import { useNavigate } from '@tanstack/react-router'
import { useAgentStore } from '@washi/ui'
import { useRef, useState } from 'react'
import { useDismiss } from '@/components/shared/dismiss'
import type { BarMode } from '../types'

/** The bar's chat, and what its ⋯ does: rename in place, or delete and go back to the list. */
export function useChatBar(workspaceId: string, chatId: string | undefined) {
  const session = useAgentStore((state) => state.sessions.find((each) => each.id === chatId))
  const running = useAgentStore((state) => state.running)
  const [mode, setMode] = useState<BarMode>('idle')
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const isMenuOpen = mode === 'menu' || mode === 'confirming'
  useDismiss(menuRef, isMenuOpen, () => setMode('idle'))

  const rename = (title: string) => {
    setMode('idle')
    const next = title.trim()
    if (session && next && next !== session.title) {
      void useAgentStore.getState().renameSession(session.id, next)
    }
  }

  // Leave first: the store hands the next chat over, and this page would follow it there.
  const remove = () => {
    if (!session) return
    setMode('idle')
    void navigate({ to: '/w/$workspaceId/chats', params: { workspaceId } }).then(() =>
      useAgentStore.getState().deleteSession(session.id),
    )
  }

  return { session, running, mode, setMode, isMenuOpen, menuRef, rename, remove }
}
