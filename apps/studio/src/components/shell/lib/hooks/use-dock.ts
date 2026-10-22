import { useAgentStore } from '@washi/ui'
import { useEffect } from 'react'
import { readDock, writeDock } from '../utils'

/** Whether the panel docks beside the page is remembered per workspace, like the fold (D61). */
export function useDock(workspaceId: string): boolean {
  const docked = useAgentStore((state) => state.docked)

  useEffect(() => {
    useAgentStore.getState().setDocked(readDock(workspaceId))
    return useAgentStore.subscribe((state, previous) => {
      if (state.docked !== previous.docked) writeDock(workspaceId, state.docked)
    })
  }, [workspaceId])

  return docked
}
