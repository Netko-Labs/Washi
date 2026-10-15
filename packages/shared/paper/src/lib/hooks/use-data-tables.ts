import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePaperHost } from '../../provider'
import { toRows } from '../rows'
import type { DataContextValue, Row } from '../types'

/** The page's data, refetched after its own verbs and whenever the host says data moved. */
export function useDataTables(tables: string[]): DataContextValue {
  const host = usePaperHost()
  const [version, setVersion] = useState(0)
  const [loaded, setLoaded] = useState<Record<string, Row[]>>({})
  const key = tables.join(',')
  const refresh = useCallback(() => setVersion((current) => current + 1), [])

  useEffect(() => host.onDataChange?.(refresh), [host, refresh])

  useEffect(() => {
    let alive = true
    Promise.all(
      key
        .split(',')
        .filter(Boolean)
        .map((table) =>
          host
            .runQuery({ table, limit: 1000 })
            .then((result) => [table, toRows(result.rows)] as const)
            .catch(() => [table, []] as const),
        ),
    ).then((entries) => alive && setLoaded(Object.fromEntries(entries)))
    return () => {
      alive = false
    }
  }, [host, key, version])

  return useMemo(() => ({ tables: loaded, version, refresh }), [loaded, version, refresh])
}
