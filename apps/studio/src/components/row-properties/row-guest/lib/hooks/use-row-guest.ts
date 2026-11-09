import { useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'
import type { RowGuest } from '../types'

/** Who asked for this row through a page's link, once approved (D131); null for a member's own. */
export function useRowGuest(recordId: string): RowGuest | null {
  const [guest, setGuest] = useState<{ recordId: string; guest: RowGuest | null } | null>(null)

  useEffect(() => {
    let alive = true
    api.suggestions.guest
      .query({ recordId })
      .then((found) => alive && setGuest({ recordId, guest: found }))
      .catch(() => alive && setGuest({ recordId, guest: null }))
    return () => {
      alive = false
    }
  }, [recordId])

  // Another row's guest never shows while this one's loads.
  return guest?.recordId === recordId ? guest.guest : null
}
