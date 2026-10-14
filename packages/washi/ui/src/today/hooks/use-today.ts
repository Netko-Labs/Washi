import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api'

type TodayWire = Awaited<ReturnType<typeof api.agents.today.query>>

const POLL_MS = 10_000

/** The dashboard's real numbers: the last day's turns, the open questions, the spend. */
export function useToday() {
  const [today, setToday] = useState<TodayWire | null>(null)

  const refresh = useCallback(async () => {
    try {
      setToday(await api.agents.today.query())
    } catch {
      // the next poll retries
    }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = setInterval(() => void refresh(), POLL_MS)
    return () => clearInterval(timer)
  }, [refresh])

  const decide = async (id: string, decision: 'allow_once' | 'reject_once') => {
    await api.agents.resolveApproval.mutate({ id, decision })
    await refresh()
  }

  return { today, decide }
}
