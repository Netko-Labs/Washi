import { useCallback, useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'
import { TODAY_POLL_MS } from '../constants'
import type { TodayWire } from '../types'

/** Polled: Today is a page you glance at, and a stale ten seconds costs nothing. */
export function useToday() {
  const [today, setToday] = useState<TodayWire | null>(null)

  const refresh = useCallback(async () => {
    try {
      setToday(await api.agents.today.query())
    } catch {
      // the next poll retries; Today is never the reason a page fails
    }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = setInterval(() => void refresh(), TODAY_POLL_MS)
    return () => clearInterval(timer)
  }, [refresh])

  const decide = async (id: string, decision: 'allow_once' | 'reject_once') => {
    await api.agents.resolveApproval.mutate({ id, decision })
    await refresh()
  }

  return { today, decide }
}
