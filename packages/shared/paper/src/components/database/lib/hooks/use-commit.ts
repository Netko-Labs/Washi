import { useState } from 'react'
import { useData } from '../../../../data'
import { usePaperHost } from '../../../../provider'
import type { Commit } from '../types'

/** One cell write through `table.update`; the view refetches, a refusal is said once. */
export function useCommit(table: string): { commit: Commit; error: string | null } {
  const host = usePaperHost()
  const { refresh } = useData()
  const [error, setError] = useState<string | null>(null)

  const commit: Commit = async (row, column, value) => {
    try {
      await host.runAction({ verb: 'table.update', table, row, set: { [column]: value } })
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      refresh()
    }
  }

  return { commit, error }
}
