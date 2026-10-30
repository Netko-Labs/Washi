import { useState } from 'react'
import { api } from '../../../api'
import type { RestoreState } from '../types'

/** Takes a table Washi trashed back out of the Trash, rows as they were (D121). */
export function useRestoreTable(id: string) {
  const [state, setState] = useState<RestoreState>('idle')
  const restore = async () => {
    setState('busy')
    try {
      await api.tables.restore.mutate({ id })
      setState('restored')
    } catch {
      setState('gone')
    }
  }
  return { state, restore }
}
