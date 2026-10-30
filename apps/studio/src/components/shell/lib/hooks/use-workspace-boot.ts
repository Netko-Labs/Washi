import {
  useAgentStore,
  useLiveStore,
  useSheetsStore,
  useThemesStore,
  useUnsplashStore,
  useViewStore,
} from '@washi/ui'
import { useEffect } from 'react'
import { useMentionsPoll } from '@/components/mentions'
import { useRemindersPoll } from '@/components/reminders'
import { useSession } from '@/integrations/auth'

/**
 * Loads what the loader reset. The reset itself happens in the route loader — child routes
 * open their tab in an effect, which runs before this one would.
 */
export function useWorkspaceBoot(workspaceId: string) {
  const { data: session } = useSession()
  useMentionsPoll(workspaceId)
  useRemindersPoll(workspaceId)
  const name = session?.user.name
  const email = session?.user.email

  useEffect(() => {
    useViewStore.getState().setIdentity({ name: name ?? '', email: email ?? '' })
  }, [name, email])

  useEffect(() => {
    void useSheetsStore.getState().refresh()
    void useThemesStore.getState().refresh()
    void useUnsplashStore.getState().refresh()
    void useAgentStore.getState().init()
    useLiveStore.getState().connect()
    // Only the subscriptions need closing; resetting state is the loader's job, and doing it
    // here as well would wipe what the next workspace's loader already set.
    return () => {
      useAgentStore.getState().reset()
      useLiveStore.getState().disconnect()
    }
  }, [workspaceId])
}
