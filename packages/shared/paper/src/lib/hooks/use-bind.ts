import { useEffect, useState } from 'react'
import { useData } from '../../data'
import { usePaperHost } from '../../provider'
import type { BindQuery } from '../../registry'
import { useSheetState } from '../../state'
import { resolveQuery } from '../bind'
import { toRows } from '../rows'
import type { BindState } from '../types'

/**
 * One bound query, its `{ state }` filters read from the page (D72). Refetches whenever a verb
 * lands or a picker moves, so a page heals after its own writes and follows its own controls.
 */
export function useBind(query: BindQuery | undefined): BindState {
  const host = usePaperHost()
  const { version } = useData()
  const { values } = useSheetState()
  const [state, setState] = useState<BindState>({ rows: [], status: 'loading', error: null })
  const key = query ? JSON.stringify(resolveQuery(query, values)) : ''

  useEffect(() => {
    if (!key) return
    let alive = true
    host
      .runQuery(JSON.parse(key))
      .then(
        (result) => alive && setState({ rows: toRows(result.rows), status: 'ready', error: null }),
      )
      .catch(
        (cause: unknown) => alive && setState({ rows: [], status: 'error', error: String(cause) }),
      )
    return () => {
      alive = false
    }
  }, [host, key, version])

  return state
}
