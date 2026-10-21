import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/rpc'
import type {
  ApprovalMode,
  InferencePreference,
  InferenceWire,
  LocalModel,
  SpendWire,
} from '../types'

/** What the next turn runs on and what today cost — the two things the Agents tab is for. */
export function useAgentRuntime() {
  const [inference, setInference] = useState<InferenceWire | null>(null)
  const [spend, setSpend] = useState<SpendWire | null>(null)
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>('ask')
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [nextInference, nextSpend, approvals] = await Promise.all([
        api.agents.inference.query(),
        api.agents.spend.query(),
        api.agents.approvalMode.query(),
      ])
      setInference(nextInference)
      setSpend(nextSpend)
      setApprovalMode(approvals.mode)
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
    approvalMode,
    error,
    refresh,
    pickApprovalMode: (mode: ApprovalMode) =>
      guard(async () => setApprovalMode((await api.agents.setApprovalMode.mutate({ mode })).mode)),
    prefer: (preference: InferencePreference) =>
      guard(async () => setInference(await api.agents.setInference.mutate({ preference }))),
    pickLocalModel: (model: LocalModel) =>
      guard(async () => setInference(await api.agents.setLocalModel.mutate({ model }))),
    setDailyCap: (capUsd: number) =>
      guard(async () => setSpend(await api.agents.setDailyCap.mutate({ capUsd }))),
    resume: () => guard(async () => setSpend(await api.agents.resume.mutate())),
  }
}
