import { useRouter, useRouterState } from '@tanstack/react-router'
import { type TabKey, useAgentStore, useViewStore } from '@washi/ui'
import type { MouseEvent } from 'react'
import { useMentionsStore } from '@/components/mentions'
import { pathFor } from '@/components/shell'
import type { PlaceId } from '../types'
import { openInPlace } from '../utils'

const TABS: Record<Exclude<PlaceId, 'routines'>, TabKey> = {
  home: 'view:dashboard',
  inbox: 'view:inbox',
  chats: 'view:chats',
}

/** Which place is open, where each one lives, and the Inbox's count. Nothing is open on a page. */
export function usePlaces(workspaceId: string, onNavigate: () => void) {
  const router = useRouter()
  const activeTab = useViewStore((state) => state.activeTab)
  const settingsTab = useRouterState({
    select: (state) => (state.location.search as { tab?: string }).tab,
  })
  const inboxCount =
    useAgentStore((state) => state.approvals.length) + useMentionsStore((state) => state.unread)

  const active: PlaceId | null =
    !activeTab || activeTab === 'view:dashboard'
      ? 'home'
      : activeTab === 'view:inbox'
        ? 'inbox'
        : activeTab === 'view:chats'
          ? 'chats'
          : activeTab === 'view:settings' && settingsTab === 'routines'
            ? 'routines'
            : null

  const hrefOf = (id: PlaceId) =>
    id === 'routines'
      ? `${pathFor(workspaceId, 'view:settings')}?tab=routines`
      : pathFor(workspaceId, TABS[id])

  const open = (id: PlaceId) => (event: MouseEvent) =>
    openInPlace(event, () => {
      if (id === 'routines') void router.navigate({ href: hrefOf(id) })
      else useViewStore.getState().openTab(TABS[id])
      onNavigate()
    })

  return { active, inboxCount, hrefOf, open }
}
