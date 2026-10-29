import type { EnabledModel } from '@washi/domain'
import { useCallback, useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'
import type { ModelOption } from '@/lib/types'
import type {
  AgentSettingsState,
  ApprovalMode,
  Effort,
  KeyInput,
  KeyState,
  ResumeBy,
  SearchKeyState,
  ServerKeyUse,
  SpendState,
} from '../types'

/**
 * Everything the settings screen needs in one place: the stored keys, what the
 * agent has spent today, its standing choices, and the catalogue a picker chooses from.
 */
export function useAgentSettings() {
  const [key, setKey] = useState<KeyState | null>(null)
  const [serverKey, setServerKey] = useState<ServerKeyUse | null>(null)
  const [searchKey, setSearchKey] = useState<SearchKeyState | null>(null)
  const [approvalMode, setApprovalModeState] = useState<ApprovalMode>('ask')
  const [spend, setSpend] = useState<SpendState | null>(null)
  const [settings, setSettings] = useState<AgentSettingsState | null>(null)
  const [models, setModels] = useState<ModelOption[]>([])
  const [catalogueSource, setCatalogueSource] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const [stored, lent, exa, approvals, today, standing, catalogue] = await Promise.all([
        api.workspaces.agentKey.query(),
        api.workspaces.serverKey.query(),
        api.workspaces.integrationKey.query({ integration: 'exa' }),
        api.agents.approvalMode.query(),
        api.agents.spend.query(),
        api.agents.settings.query(),
        api.models.list.query(),
      ])
      setKey(stored as KeyState | null)
      setServerKey(lent)
      setSearchKey(exa as SearchKeyState | null)
      setApprovalModeState(approvals.mode)
      setSpend(today as SpendState)
      setSettings(standing as AgentSettingsState)
      setModels(catalogue.models as ModelOption[])
      setCatalogueSource(catalogue.source)
      setError(null)
    } catch (cause) {
      setError(String(cause))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // One shape for every write: the error is kept for the screen, the result says whether it took.
  const attempt = async (run: () => Promise<void>) => {
    setError(null)
    try {
      await run()
      return true
    } catch (cause) {
      setError(String(cause))
      return false
    }
  }

  const save = (input: KeyInput) =>
    attempt(async () => {
      await api.workspaces.setAgentKey.mutate({
        key: input.key,
        provider: input.provider as 'anthropic' | 'openrouter',
        model: input.model,
      })
      await refresh()
    })

  /** For the dialog: the refusal comes back to it; the screen's own error stays as it was. */
  const connect = async (target: 'anthropic' | 'openrouter' | 'exa', secret: string) => {
    try {
      if (target === 'exa') {
        await api.workspaces.setIntegrationKey.mutate({ integration: 'exa', key: secret })
      } else {
        // Replacing a provider's key keeps its model; a new provider starts from its default.
        await api.workspaces.setAgentKey.mutate({
          key: secret,
          provider: target,
          model: key?.provider === target ? key.model : null,
        })
      }
      await refresh()
      return null
    } catch (cause) {
      return String(cause)
    }
  }

  const removeKey = () =>
    attempt(async () => {
      await api.workspaces.removeAgentKey.mutate()
      await refresh()
    })

  const setModel = (model: string | null) =>
    attempt(async () => {
      await api.workspaces.setAgentModel.mutate({ model })
      setKey((current) => (current ? { ...current, model } : current))
    })

  const saveSearchKey = (secret: string) =>
    attempt(async () => {
      await api.workspaces.setIntegrationKey.mutate({ integration: 'exa', key: secret })
      await refresh()
    })

  const removeSearchKey = () =>
    attempt(async () => {
      await api.workspaces.removeIntegrationKey.mutate({ integration: 'exa' })
      await refresh()
    })

  const setApprovalMode = (mode: ApprovalMode) =>
    attempt(async () => {
      setApprovalModeState((await api.agents.setApprovalMode.mutate({ mode })).mode)
    })

  const resume = () =>
    attempt(async () => {
      setSpend((await api.agents.resume.mutate()) as SpendState)
    })

  const pause = () =>
    attempt(async () => {
      setSpend((await api.agents.pause.mutate()) as SpendState)
    })

  const setDailyCap = (capUsd: number) =>
    attempt(async () => {
      setSpend((await api.agents.setDailyCap.mutate({ capUsd })) as SpendState)
      setSettings((current) => (current ? { ...current, capUsd } : current))
    })

  const setTurnCap = (turnCap: number) =>
    attempt(async () => {
      setSpend((await api.agents.setTurnCap.mutate({ turnCap })) as SpendState)
      setSettings((current) => (current ? { ...current, turnCap } : current))
    })

  const setResumeBy = (resumeBy: ResumeBy) =>
    attempt(async () => {
      setSettings((await api.agents.setResumeBy.mutate({ resumeBy })) as AgentSettingsState)
    })

  const setDefaultEffort = (effort: Effort) =>
    attempt(async () => {
      setSettings((await api.agents.setDefaultEffort.mutate({ effort })) as AgentSettingsState)
    })

  const setEnabledModels = (enabled: EnabledModel[] | null) =>
    attempt(async () => {
      setSettings(
        (await api.agents.setEnabledModels.mutate({ models: enabled })) as AgentSettingsState,
      )
    })

  return {
    key,
    serverKey,
    searchKey,
    approvalMode,
    spend,
    settings,
    models,
    catalogueSource,
    error,
    loading,
    save,
    connect,
    removeKey,
    setModel,
    saveSearchKey,
    removeSearchKey,
    setApprovalMode,
    resume,
    pause,
    setDailyCap,
    setTurnCap,
    setResumeBy,
    setDefaultEffort,
    setEnabledModels,
    refresh,
  }
}
