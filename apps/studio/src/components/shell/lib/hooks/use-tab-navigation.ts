import { useRouter } from '@tanstack/react-router'
import { useViewStore } from '@washi/ui'
import { useEffect } from 'react'
import { readActiveWorkspace } from '@/integrations/trpc'
import { pathFor, saveTabs } from '../utils'

/**
 * The other direction: a tab chosen anywhere (strip, sidebar, palette, the agent opening a
 * page) moves the address bar, and the strip is saved for the next visit.
 */
export function useTabNavigation(workspaceId: string) {
  const router = useRouter()

  useEffect(
    () =>
      useViewStore.subscribe((state, previous) => {
        // A switch resets the stores in the next workspace's loader, while this shell is mounted.
        if (readActiveWorkspace() !== workspaceId) return
        if (state.tabs !== previous.tabs) saveTabs(workspaceId, state.tabs)
        if (state.activeTab === previous.activeTab) return
        const target = pathFor(workspaceId, state.activeTab)
        if (target !== router.state.location.pathname) router.history.push(target)
      }),
    [workspaceId, router],
  )
}
