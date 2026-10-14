import { useAgentStore, useSheetsStore, useViewStore } from '@washi/ui'
import { useEffect } from 'react'
import { useSession } from '@/integrations/auth'
import type { WorkspaceSummary } from '@/lib/types'

/**
 * The shared stores are one per page, and a workspace switch must not leak the last one's
 * tabs, sessions or subscriptions into the next. Who is here comes from the session.
 */
export function useWorkspaceBoot(workspace: WorkspaceSummary) {
  const { data: session } = useSession()
  const name = session?.user.name
  const email = session?.user.email

  useEffect(() => {
    useViewStore.getState().setIdentity({ name: name ?? '', email: email ?? '' })
  }, [name, email])

  useEffect(() => {
    const view = useViewStore.getState()
    view.setWorkspaceName(workspace.name)
    view.closeAll()
    view.openTab('view:dashboard')
    void useSheetsStore.getState().refresh()
    void useAgentStore.getState().init()
    return () => {
      useAgentStore.getState().reset()
      useSheetsStore.getState().reset()
      useViewStore.getState().closeAll()
    }
  }, [workspace])
}
