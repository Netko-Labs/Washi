import { useEffect, useState } from 'react'
import { useData } from '../../../../data'
import { usePaperHost } from '../../../../provider'
import type { DatabaseLoad } from '../types'

/**
 * The table's spec and the people a person cell can name; null until both arrive. A form asks
 * for what it may write, which on a link that takes suggestions is not what it may read (D120).
 */
export function useDatabase(table: string, purpose: 'read' | 'write' = 'read'): DatabaseLoad {
  const host = usePaperHost()
  const { version } = useData()
  const [db, setDb] = useState<DatabaseLoad>(null)

  useEffect(() => {
    let alive = true
    // Names are a nicety: a host that cannot say who is here still shows the table.
    const people = host.describePeople?.().catch(() => []) ?? Promise.resolve([])
    const spec =
      purpose === 'write' && host.describeWritable
        ? host.describeWritable(table)
        : host.describeTable(table)
    Promise.all([spec, people])
      .then(
        ([spec, members]) => alive && setDb(spec ? { table, spec, people: members } : 'missing'),
      )
      .catch(() => alive && setDb('unreadable'))
    return () => {
      alive = false
    }
  }, [host, table, version, purpose])

  return db
}
