import { type TabKey, useAgentStore, useViewStore } from '@washi/ui'
import type { MouseEvent } from 'react'
import { useMentionsStore } from '@/components/mentions'
import { pathFor } from '@/components/shell'
import type { PlaceId } from '../types'
import { openInPlace } from '../utils'

const TABS: Record<PlaceId, TabKey> = {
  home: 'view:dashboard',
  inbox: 'view:inbox',
  chats: 'view:chats',
  routines: 'view:routines',
}

/** Which place is open, where each one lives, and the Inbox's count. Nothing is open on a page. */
export function usePlaces(workspaceId: string, onNavigate: () => void) {
  const activeTab = useViewStore((state) => state.activeTab)
  const inboxCount =
    useAgentStore((state) => state.approvals.length) + useMentionsStore((state) => state.unread)

  const active: PlaceId | null =
    !activeTab || activeTab === 'view:dashboard'
      ? 'home'
      : activeTab === 'view:inbox'
        ? 'inbox'
        : activeTab === 'view:chats'
          ? 'chats'
          : activeTab === 'view:routines'
            ? 'routines'
            : null

  const hrefOf = (id: PlaceId) => pathFor(workspaceId, TABS[id])

  const open = (id: PlaceId) => (event: MouseEvent) =>
    openInPlace(event, () => {
      useViewStore.getState().openTab(TABS[id])
      onNavigate()
    })

  return { active, inboxCount, hrefOf, open }
}
