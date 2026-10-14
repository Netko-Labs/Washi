import { useAgentStore, useFavoritesStore, useSheetsStore, useViewStore } from '@washi/ui'
import { setActiveWorkspace } from '@/integrations/trpc'
import type { WorkspaceSummary } from '@/lib/types'
import { savedTabs } from './utils'

/** Runs in the loader, before any route under the workspace renders. */
export function enterWorkspace(workspace: WorkspaceSummary): void {
  setActiveWorkspace(workspace.id)
  useAgentStore.getState().reset()
  useSheetsStore.getState().reset()
  useFavoritesStore.getState().bind(workspace.id)
  const view = useViewStore.getState()
  view.closeAll()
  view.setWorkspaceName(workspace.name)
  view.setTabs(savedTabs(workspace.id))
}
