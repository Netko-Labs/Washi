import type { RowOf } from '@washi/domain'
import { useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'

/** The row behind a page, refetched when the page changes; null for an ordinary page. */
export function useRowOf(sheetId: string, version: string | undefined): RowOf | null {
  const [rowOf, setRowOf] = useState<RowOf | null>(null)

  useEffect(() => {
    let alive = true
    api.tables.rowOf
      .query({ sheetId })
      .then((next) => alive && setRowOf(next))
      .catch(() => alive && setRowOf(null))
    return () => {
      alive = false
    }
  }, [sheetId, version])

  return rowOf
}
