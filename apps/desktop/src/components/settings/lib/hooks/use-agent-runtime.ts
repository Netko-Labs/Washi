import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/rpc'
import type { InferencePreference, InferenceWire, SpendWire } from '../types'

/** What the next turn runs on and what today cost — the two things the Agents tab is for. */
export function useAgentRuntime() {
  const [inference, setInference] = useState<InferenceWire | null>(null)
  const [spend, setSpend] = useState<SpendWire | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [nextInference, nextSpend] = await Promise.all([
        api.agents.inference.query(),
        api.agents.spend.query(),
      ])
      setInference(nextInference)
      setSpend(nextSpend)
      setError(null)
    } catch (cause) {
      setError(String(cause))
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const guard = async (action: () => Promise<void>) => {
    try {
      await action()
      setError(null)
    } catch (cause) {
      setError(String(cause))
    }
  }

  return {
    inference,
    spend,
    error,
    refresh,
    prefer: (preference: InferencePreference) =>
      guard(async () => setInference(await api.agents.setInference.mutate({ preference }))),
    setDailyCap: (capUsd: number) =>
      guard(async () => setSpend(await api.agents.setDailyCap.mutate({ capUsd }))),
    resume: () => guard(async () => setSpend(await api.agents.resume.mutate())),
  }
}
