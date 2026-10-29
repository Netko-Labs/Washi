import type { TrashEntry, TrashedTable } from '@washi/domain'
import { useSheetsStore } from '@washi/ui'
import { useCallback, useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'

/** The Trash is read only here, so its lists live with the page, not in a store. */
export function useTrash() {
  const [entries, setEntries] = useState<TrashEntry[] | null>(null)
  const [tables, setTables] = useState<TrashedTable[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [pages, trashedTables] = await Promise.all([
        api.sheets.trash.query(),
        api.tables.trashed.query(),
      ])
      setEntries(pages)
      setTables(trashedTables)
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
    tables,
    error,
    restore: (id: string) => act(() => api.sheets.restore.mutate({ id })),
    purge: (id: string) => act(() => api.sheets.purge.mutate({ id })),
    empty: () => act(() => api.sheets.emptyTrash.mutate()),
    restoreTable: (id: string) => act(() => api.tables.restore.mutate({ id })),
    purgeTable: (id: string) => act(() => api.tables.purge.mutate({ id })),
  }
}
