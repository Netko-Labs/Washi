import { useEffect, useState } from 'react'
import { useData } from '../../../../data'
import { usePaperHost } from '../../../../provider'

/**
 * Times visitors asked for and nobody has decided yet (D120), read again whenever data moves.
 * A host that keeps no suggestions has none; a refused read draws none rather than failing.
 */
export function useRequested(table: string, date: string, from: string, to: string): string[] {
  const host = usePaperHost()
  const { version } = useData()
  const [cells, setCells] = useState<string[]>([])

  useEffect(() => {
    if (!host.requested) return
    let alive = true
    host
      .requested(table, date, from, to)
      .then((found) => alive && setCells(found))
      .catch(() => alive && setCells([]))
    return () => {
      alive = false
    }
  }, [host, table, date, from, to, version])

  return cells
}
