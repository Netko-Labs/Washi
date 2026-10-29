import { useEffect, useState } from 'react'
import { useData } from '../../data'
import { usePaperHost } from '../../provider'
import type { TableLook } from '../types'

const UNKNOWN: TableLook = { spec: null, people: [] }

/** A table's columns and the people a person cell can name, read once; nothing until both arrive. */
export function useTableSpec(table: string | undefined): TableLook {
  const host = usePaperHost()
  const { version } = useData()
  const [look, setLook] = useState<TableLook>(UNKNOWN)

  useEffect(() => {
    if (!table) return
    let alive = true
    // Names are a nicety: a host that cannot say who is here still draws the board.
    const people = host.describePeople?.().catch(() => []) ?? Promise.resolve([])
    Promise.all([host.describeTable(table), people])
      .then(([spec, members]) => alive && setLook({ spec, people: members }))
      .catch(() => alive && setLook(UNKNOWN))
    return () => {
      alive = false
    }
  }, [host, table, version])

  return look
}
