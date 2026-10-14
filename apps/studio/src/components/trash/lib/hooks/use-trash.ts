import type { TrashEntry } from '@washi/domain'
import { useSheetsStore } from '@washi/ui'
import { useCallback, useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'

/** The Trash is read only here, so its list lives with the page, not in a store. */
export function useTrash() {
  const [entries, setEntries] = useState<TrashEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setEntries(await api.sheets.trash.query())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const act = async (run: () => Promise<unknown>) => {
    setError(null)
    try {
      await run()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      await Promise.all([load(), useSheetsStore.getState().refresh()])
    }
  }

  return {
    entries,
    error,
    restore: (id: string) => act(() => api.sheets.restore.mutate({ id })),
    purge: (id: string) => act(() => api.sheets.purge.mutate({ id })),
    empty: () => act(() => api.sheets.emptyTrash.mutate()),
  }
}
