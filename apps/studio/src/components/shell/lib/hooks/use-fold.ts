import { useEffect } from 'react'
import { useShellStore } from '../shell-store'
import type { FoldState } from '../types'
import { readFold, writeFold } from '../utils'

/** The fold is remembered per workspace; `⌘\` toggles it, Escape ends a peek. */
export function useFold(workspaceId: string): FoldState {
  const folded = useShellStore((state) => state.folded)
  const peeking = useShellStore((state) => state.peeking)

  useEffect(() => {
    const shell = useShellStore.getState
    shell().setFolded(readFold(workspaceId))
    const unsubscribe = useShellStore.subscribe((state, previous) => {
      if (state.folded !== previous.folded) writeFold(workspaceId, state.folded)
    })
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === '\\' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        shell().toggleFold()
      }
      if (event.key === 'Escape' && shell().peeking) shell().setPeeking(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      unsubscribe()
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [workspaceId])

  return { folded, peeking }
}
