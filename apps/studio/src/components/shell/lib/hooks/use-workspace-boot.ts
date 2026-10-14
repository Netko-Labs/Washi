import { useAgentStore, useSheetsStore, useViewStore } from '@washi/ui'
import { useEffect } from 'react'
import { useSession } from '@/integrations/auth'

/**
 * Loads what the loader reset. The reset itself happens in the route loader — child routes
 * open their tab in an effect, which runs before this one would.
 */
export function useWorkspaceBoot(workspaceId: string) {
  const { data: session } = useSession()
  const name = session?.user.name
  const email = session?.user.email

  useEffect(() => {
    useViewStore.getState().setIdentity({ name: name ?? '', email: email ?? '' })
  }, [name, email])

  useEffect(() => {
    void useSheetsStore.getState().refresh()
    void useAgentStore.getState().init()
    return () => {
      useAgentStore.getState().reset()
      useSheetsStore.getState().reset()
    }
  }, [workspaceId])
}
