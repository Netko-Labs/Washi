import { useCallback, useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'
import type { ModelOption } from '@/lib/types'
import type { KeyInput, KeyState, SearchKeyState, SpendState } from '../types'

/**
 * Everything the settings screen needs in one place: the stored key, what the
 * agent has spent today, and the catalogue a picker chooses from.
 */
export function useAgentSettings() {
  const [key, setKey] = useState<KeyState | null>(null)
  const [searchKey, setSearchKey] = useState<SearchKeyState | null>(null)
  const [spend, setSpend] = useState<SpendState | null>(null)
  const [models, setModels] = useState<ModelOption[]>([])
  const [catalogueSource, setCatalogueSource] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const [stored, exa, today, catalogue] = await Promise.all([
        api.workspaces.agentKey.query(),
        api.workspaces.integrationKey.query({ integration: 'exa' }),
        api.agents.spend.query(),
        api.models.list.query(),
      ])
      setKey(stored as KeyState | null)
      setSearchKey(exa as SearchKeyState | null)
      setSpend(today as SpendState)
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

  const save = async (input: KeyInput) => {
    setError(null)
    try {
      await api.workspaces.setAgentKey.mutate({
        key: input.key,
        provider: input.provider as 'anthropic' | 'openrouter',
        model: input.model,
      })
      await refresh()
      return true
    } catch (cause) {
      setError(String(cause))
      return false
    }
  }

  const saveSearchKey = async (secret: string) => {
    setError(null)
    try {
      await api.workspaces.setIntegrationKey.mutate({ integration: 'exa', key: secret })
      await refresh()
      return true
    } catch (cause) {
      setError(String(cause))
      return false
    }
  }

  const resume = async () => {
    setSpend((await api.agents.resume.mutate()) as SpendState)
  }

  const setDailyCap = async (capUsd: number) => {
    try {
      setSpend((await api.agents.setDailyCap.mutate({ capUsd })) as SpendState)
      return true
    } catch (cause) {
      setError(String(cause))
      return false
    }
  }

  return {
    key,
    searchKey,
    spend,
    models,
    catalogueSource,
    error,
    loading,
    save,
    saveSearchKey,
    resume,
    setDailyCap,
    refresh,
  }
}
