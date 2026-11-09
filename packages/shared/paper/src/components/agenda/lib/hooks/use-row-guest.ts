import { useEffect, useState } from 'react'
import { useData } from '../../../../data'
import { usePaperHost } from '../../../../provider'
import type { RowGuest } from '../types'

/** Who asked for this row through the page's link, once approved (D131); null for a member's own. */
export function useRowGuest(id: string | null): RowGuest | null {
  const host = usePaperHost()
  const { version } = useData()
  const [guest, setGuest] = useState<RowGuest | null>(null)

  useEffect(() => {
    let alive = true
    if (!id || !host.rowGuest) return
    host
      .rowGuest(id)
      .then((found) => alive && setGuest(found))
      .catch(() => alive && setGuest(null))
    return () => {
      alive = false
    }
  }, [host, id, version])

  return guest
}
