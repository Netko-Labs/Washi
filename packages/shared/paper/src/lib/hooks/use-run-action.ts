import { useCallback } from 'react'
import { useData } from '../../data'
import { usePaperHost } from '../../provider'
import { useSheetState } from '../../state'
import { resolveActionParams } from '../bind'
import type { ActionRef } from '../types'

/**
 * Dispatches a verb. `state.set` lands in page state and never reaches the vault;
 * everything else goes to the host, its `params` read from state, then every bind refetches.
 */
export function useRunAction(): (action: ActionRef) => Promise<void> {
  const host = usePaperHost()
  const { refresh } = useData()
  const { values, set } = useSheetState()

  return useCallback(
    async (action) => {
      if (action.verb === 'state.set') {
        const key = String(action.key ?? '')
        const value = action.value
        if (key) {
          set(
            key,
            typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
              ? value
              : null,
          )
        }
        return
      }
      await host.runAction(resolveActionParams(action, values))
      refresh()
    },
    [host, refresh, set, values],
  )
}
