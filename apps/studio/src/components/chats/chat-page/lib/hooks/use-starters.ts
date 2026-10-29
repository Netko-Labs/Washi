import type { UserTable } from '@washi/domain'
import { useSheetsStore } from '@washi/ui'
import { useEffect, useMemo, useState } from 'react'
import { api } from '@/integrations/trpc'
import type { Starter } from '../types'
import { startersFor } from '../utils'

/** Starters read off this workspace's own pages and tables; none until the tables answer. */
export function useStarters(): Starter[] | null {
  const sheets = useSheetsStore((state) => state.sheets)
  const [tables, setTables] = useState<UserTable[] | null>(null)

  useEffect(() => {
    void api.tables.list
      .query()
      .then(setTables)
      .catch(() => setTables([]))
  }, [])

  return useMemo(() => (tables ? startersFor(sheets, tables) : null), [sheets, tables])
}
