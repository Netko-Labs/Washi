import type { TableCatalogEntry } from '@washi/domain'
import { useLiveStore, useSheetsStore } from '@washi/ui'
import { useCallback, useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'

/** The workspace's tables, read again whenever its pages or its data move. */
export function useCatalog() {
  const [entries, setEntries] = useState<TableCatalogEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const sheets = useSheetsStore((state) => state.sheets)

  const load = useCallback(async () => {
    try {
      setEntries(await api.tables.catalog.query())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }, [])

  // `sheets` moves when a page is saved or trashed, and so may the catalog.
  useEffect(() => {
    void load()
  }, [load, sheets])
  useEffect(() => useLiveStore.getState().onData(() => void load()), [load])

  const trash = async (id: string): Promise<boolean> => {
    setError(null)
    try {
      await api.tables.trash.mutate({ id })
      return true
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
      return false
    } finally {
      await load()
    }
  }

  return { entries, error, trash }
}
