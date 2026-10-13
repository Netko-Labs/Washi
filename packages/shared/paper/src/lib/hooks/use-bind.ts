import type { InkQuery } from '@washi/ink'
import { useEffect, useState } from 'react'
import { useData } from '../../data'
import { usePaperHost } from '../../provider'
import type { BindState } from '../types'

/** One bound query. Refetches whenever a verb lands, so a page heals after its own writes. */
export function useBind(query: InkQuery | undefined): BindState {
  const host = usePaperHost()
  const { version } = useData()
  const [state, setState] = useState<BindState>({ rows: [], status: 'loading', error: null })
  const key = JSON.stringify(query)

  useEffect(() => {
    if (!query) return
    let alive = true
    host
      .runQuery(query)
      .then((result) => alive && setState({ rows: result.rows, status: 'ready', error: null }))
      .catch(
        (cause: unknown) => alive && setState({ rows: [], status: 'error', error: String(cause) }),
      )
    return () => {
      alive = false
    }
  }, [host, key, version])

  return state
}
