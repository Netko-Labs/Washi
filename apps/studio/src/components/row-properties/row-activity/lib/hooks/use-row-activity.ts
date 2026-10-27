import { useLiveStore } from '@washi/ui'
import { useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'
import { PAGE_SIZE } from '../constants'
import type { LoadedActivity, RowActivityState } from '../types'

/** A row's changes, newest first, refetched on every workspace write; Show more widens the page. */
export function useRowActivity(recordId: string): RowActivityState | null {
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [loaded, setLoaded] = useState<LoadedActivity | null>(null)
  const [stale, setStale] = useState(0)

  useEffect(() => useLiveStore.getState().onData(() => setStale((count) => count + 1)), [])

  useEffect(() => {
    let alive = true
    api.tables.rowActivity
      .query({ recordId, limit })
      .then((activity) => alive && setLoaded({ recordId, activity }))
      .catch(() => alive && setLoaded({ recordId, activity: null }))
    return () => {
      alive = false
    }
  }, [recordId, limit, stale])

  const activity = loaded?.recordId === recordId ? loaded.activity : null
  if (!activity) return null
  return { activity, showMore: () => setLimit((count) => count + PAGE_SIZE) }
}
