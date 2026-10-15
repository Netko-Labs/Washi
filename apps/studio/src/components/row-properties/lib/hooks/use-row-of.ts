import type { RowOf } from '@washi/domain'
import { useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'

/** The row behind a page, refetched when the page changes; null for an ordinary page. */
export function useRowOf(sheetId: string, version: string | undefined): RowOf | null {
  const [loaded, setLoaded] = useState<{ sheetId: string; rowOf: RowOf | null } | null>(null)

  useEffect(() => {
    let alive = true
    api.tables.rowOf
      .query({ sheetId })
      .then((rowOf) => alive && setLoaded({ sheetId, rowOf }))
      .catch(() => alive && setLoaded({ sheetId, rowOf: null }))
    return () => {
      alive = false
    }
  }, [sheetId, version])

  // Another page's row never shows while this one's loads.
  return loaded?.sheetId === sheetId ? loaded.rowOf : null
}
