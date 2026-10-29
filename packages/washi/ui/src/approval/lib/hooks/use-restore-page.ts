import { useState } from 'react'
import { api } from '../../../api'
import { useSheetsStore } from '../../../stores'
import type { RestoreState } from '../types'

/** Takes a page Washi trashed back out of the Trash, sub-pages and all (D108). */
export function useRestorePage(id: string) {
  const [state, setState] = useState<RestoreState>('idle')
  const restore = async () => {
    setState('busy')
    try {
      await api.sheets.restore.mutate({ id })
      setState('restored')
    } catch {
      setState('gone')
    }
    await useSheetsStore.getState().refresh()
  }
  return { state, restore }
}
