import { useLiveStore, useNoticeStore, useSheetsStore } from '@washi/ui'
import { useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'
import type { CellValue, LoadedRow, RowPage } from '../types'
import { usePeople } from './use-people'

/** The row behind a page, kept live, and how to write one of its cells. Null for a plain page. */
export function useRowPage(sheetId: string): RowPage | null {
  const version = useSheetsStore(
    (state) => state.sheets.find((sheet) => sheet.id === sheetId)?.hlcUpdated,
  )
  const people = usePeople()
  const [loaded, setLoaded] = useState<LoadedRow | null>(null)
  const [stale, setStale] = useState(0)

  useEffect(() => useLiveStore.getState().onData(() => setStale((count) => count + 1)), [])

  useEffect(() => {
    let alive = true
    api.tables.rowOf
      .query({ sheetId })
      .then((rowOf) => alive && setLoaded({ sheetId, rowOf }))
      .catch(() => alive && setLoaded({ sheetId, rowOf: null }))
    return () => {
      alive = false
    }
  }, [sheetId, version, stale])

  // Another page's row never shows while this one's loads.
  const rowOf = loaded?.sheetId === sheetId ? loaded.rowOf : null
  if (!rowOf) return null

  const save = async (column: string, value: CellValue) => {
    try {
      await api.capabilities.runAction.mutate({
        action: {
          verb: 'table.update',
          table: rowOf.table.name,
          row: rowOf.row.id,
          set: { [column]: value },
        },
      })
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : String(cause)
      useNoticeStore.getState().say(`That did not save — ${reason}`)
    }
    setStale((count) => count + 1)
  }
  return { rowOf, people, save }
}
