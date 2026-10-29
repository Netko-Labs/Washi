import {
  forgetEmbedHosts,
  useAgentStore,
  useFavoritesStore,
  useSheetsStore,
  useThemesStore,
  useViewStore,
} from '@washi/ui'
import { useCommentsStore } from '@/components/comments'
import { useMentionsStore } from '@/components/mentions'
import { useRemindersStore } from '@/components/reminders'
import { setActiveWorkspace } from '@/integrations/trpc'
import type { WorkspaceSummary } from '@/lib/types'

/** Runs in the loader, before any route under the workspace renders. */
export function enterWorkspace(workspace: WorkspaceSummary): void {
  setActiveWorkspace(workspace.id)
  forgetEmbedHosts()
  useAgentStore.getState().reset()
  useAgentStore.getState().bind(workspace.id)
  useSheetsStore.getState().reset()
  useThemesStore.getState().reset()
  useFavoritesStore.getState().bind(workspace.id)
  useCommentsStore.getState().reset()
  useMentionsStore.getState().reset()
  useRemindersStore.getState().reset()
  const view = useViewStore.getState()
  view.closeAll()
  view.setWorkspaceName(workspace.name)
}
