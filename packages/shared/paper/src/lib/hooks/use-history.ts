import type { HistoryQuery } from '@washi/ink'
import { useEffect, useState } from 'react'
import { useData } from '../../data'
import { usePaperHost } from '../../provider'
import type { BindState } from '../types'

const DAY = { month: 'short', day: 'numeric', timeZone: 'UTC' } as const

/** A history query's days, labelled "Oct 1"; refetched whenever a verb lands, like a bind. */
export function useHistory(query: HistoryQuery): BindState {
  const host = usePaperHost()
  const { version } = useData()
  const [state, setState] = useState<BindState>({ rows: [], status: 'loading', error: null })
  const key = JSON.stringify(query)

  useEffect(() => {
    if (!host.runHistory) {
      setState({ rows: [], status: 'error', error: 'this host keeps no history' })
      return
    }
    let alive = true
    host
      .runHistory(JSON.parse(key))
      .then((result) => {
        const rows = result.rows.map((row) => ({
          day: new Date(String(row.day)).toLocaleDateString(undefined, DAY),
          count: typeof row.count === 'number' ? row.count : 0,
        }))
        if (alive) setState({ rows, status: 'ready', error: null })
      })
      .catch(
        (cause: unknown) => alive && setState({ rows: [], status: 'error', error: String(cause) }),
      )
    return () => {
      alive = false
    }
  }, [host, key, version])

  return state
}
