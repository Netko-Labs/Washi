import { useEffect, useState } from 'react'
import { useData } from '../../../../data'
import { usePaperHost } from '../../../../provider'
import type { DatabaseContext } from '../types'

/** The table's spec and the people a person cell can name; null until both arrive. */
export function useDatabase(table: string): DatabaseContext | null | 'missing' {
  const host = usePaperHost()
  const { version } = useData()
  const [db, setDb] = useState<DatabaseContext | null | 'missing'>(null)

  useEffect(() => {
    let alive = true
    // Names are a nicety: a host that cannot say who is here still shows the table.
    const people = host.describePeople?.().catch(() => []) ?? Promise.resolve([])
    Promise.all([host.describeTable(table), people]).then(
      ([spec, members]) => alive && setDb(spec ? { table, spec, people: members } : 'missing'),
    )
    return () => {
      alive = false
    }
  }, [host, table, version])

  return db
}
