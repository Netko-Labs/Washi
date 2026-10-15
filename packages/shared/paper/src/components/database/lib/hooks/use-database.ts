import { useEffect, useState } from 'react'
import { useData } from '../../../../data'
import { usePaperHost } from '../../../../provider'
import type { DatabaseLoad } from '../types'

/** The table's spec and the people a person cell can name; null until both arrive. */
export function useDatabase(table: string): DatabaseLoad {
  const host = usePaperHost()
  const { version } = useData()
  const [db, setDb] = useState<DatabaseLoad>(null)

  useEffect(() => {
    let alive = true
    // Names are a nicety: a host that cannot say who is here still shows the table.
    const people = host.describePeople?.().catch(() => []) ?? Promise.resolve([])
    Promise.all([host.describeTable(table), people])
      .then(
        ([spec, members]) => alive && setDb(spec ? { table, spec, people: members } : 'missing'),
      )
      .catch(() => alive && setDb('unreadable'))
    return () => {
      alive = false
    }
  }, [host, table, version])

  return db
}
