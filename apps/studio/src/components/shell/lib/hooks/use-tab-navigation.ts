import { useRouter } from '@tanstack/react-router'
import { useViewStore } from '@washi/ui'
import { useEffect } from 'react'
import { readActiveWorkspace } from '@/integrations/trpc'
import { isWithin, pathFor } from '../utils'

/**
 * The other direction: a page chosen anywhere (sidebar, palette, the agent opening one) moves
 * the address bar. Nothing is saved — the URL is the whole state (D58).
 */
export function useTabNavigation(workspaceId: string) {
  const router = useRouter()

  useEffect(
    () =>
      useViewStore.subscribe((state, previous) => {
        // A switch resets the stores in the next workspace's loader, while this shell is mounted.
        if (readActiveWorkspace() !== workspaceId) return
        if (state.activeTab === previous.activeTab) return
        const target = pathFor(workspaceId, state.activeTab)
        if (!isWithin(router.state.location.pathname, target, workspaceId)) {
          router.history.push(target)
        }
      }),
    [workspaceId, router],
  )
}
