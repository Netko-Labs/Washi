import type { UserTable } from '@washi/domain'
import { useSheetsStore } from '@washi/ui'
import { useEffect, useRef, useState } from 'react'
import { api } from '@/integrations/trpc'
import type { Starter } from '../types'
import { startersFor } from '../utils'

/**
 * Starters read off this workspace's own pages and tables; none until the tables answer. Once
 * the pages have loaded they are kept for the visit, so edits elsewhere never reorder them.
 */
export function useStarters(): Starter[] | null {
  const sheets = useSheetsStore((state) => state.sheets)
  const [tables, setTables] = useState<UserTable[] | null>(null)
  const kept = useRef<Starter[] | null>(null)

  useEffect(() => {
    void api.tables.list
      .query()
      .then(setTables)
      .catch(() => setTables([]))
  }, [])

  if (!tables) return null
  if (kept.current) return kept.current
  const starters = startersFor(sheets, tables)
  if (sheets.length > 0) kept.current = starters
  return starters
}
