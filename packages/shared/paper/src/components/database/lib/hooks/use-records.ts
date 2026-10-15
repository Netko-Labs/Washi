import type { Filter } from '@washi/ink'
import { useEffect, useState } from 'react'
import { useData } from '../../../../data'
import { usePaperHost } from '../../../../provider'
import type { RecordsState } from '../types'

/** A database's rows as stored — lists stay lists; refetched whenever a verb lands. */
export function useRecords(table: string, where: Filter[] | undefined): RecordsState {
  const host = usePaperHost()
  const { version } = useData()
  const [state, setState] = useState<RecordsState>({ rows: [], status: 'loading', error: null })
  const key = JSON.stringify(where ?? [])

  useEffect(() => {
    let alive = true
    host
      .runQuery({ table, where: JSON.parse(key), limit: 1000 })
      .then((result) => alive && setState({ rows: result.rows, status: 'ready', error: null }))
      .catch(
        (cause: unknown) => alive && setState({ rows: [], status: 'error', error: String(cause) }),
      )
    return () => {
      alive = false
    }
  }, [host, table, key, version])

  return state
}
