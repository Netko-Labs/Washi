import { useCallback, useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'
import type { StorageState } from '../types'

/** Where this workspace's uploads go, and the one write anyone here may undo: going back. */
export function useStorage() {
  const [state, setState] = useState<StorageState | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setState((await api.storage.get.query()) as StorageState)
      setError(null)
    } catch {
      setError('Where uploads go did not load.')
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const remove = async () => {
    try {
      await api.storage.remove.mutate()
      await refresh()
      return true
    } catch {
      setError('That did not save. Uploads still go to your bucket.')
      return false
    }
  }

  return { state, error, refresh, remove }
}
