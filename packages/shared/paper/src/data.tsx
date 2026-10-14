import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { toRows } from './lib/rows'
import type { Row } from './lib/types'
import { usePaperHost } from './provider'

/**
 * Tables that expressions aggregate over, fetched once per sheet and again after
 * every verb. `version` is what bound primitives watch to refetch.
 */
interface DataContextValue {
  tables: Record<string, Row[]>
  version: number
  refresh: () => void
}

const DataContext = createContext<DataContextValue>({ tables: {}, version: 0, refresh: () => {} })

export function DataProvider({ tables, children }: { tables: string[]; children: ReactNode }) {
  const host = usePaperHost()
  const [version, setVersion] = useState(0)
  const [loaded, setLoaded] = useState<Record<string, Row[]>>({})
  const key = tables.join(',')

  useEffect(() => {
    let alive = true
    Promise.all(
      tables.map((table) =>
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

  const refresh = useCallback(() => setVersion((current) => current + 1), [])
  const value = useMemo(() => ({ tables: loaded, version, refresh }), [loaded, version, refresh])
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataContextValue {
  return useContext(DataContext)
}
