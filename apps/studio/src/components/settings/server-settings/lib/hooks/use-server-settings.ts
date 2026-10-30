import { useCallback, useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'
import type { ModelOption } from '@/lib/types'
import type { ProviderId, SignupMode } from '../../../lib'
import type { LentKeyTarget, ServerSettingsState, WorkspaceDefaultsState } from '../types'
import { INSTALL_POLL_MS } from '../values'

const messageOf = (cause: unknown, fallback: string) =>
  cause instanceof Error ? cause.message : fallback

/** The Server tab's state: what the server says, the catalogue a model is picked from, and writes. */
export function useServerSettings() {
  const [settings, setSettings] = useState<ServerSettingsState | null>(null)
  const [catalogue, setCatalogue] = useState<{ models: ModelOption[]; source: string | null }>({
    models: [],
    source: null,
  })
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setSettings((await api.instance.settings.query()) as unknown as ServerSettingsState)
    } catch {
      setError('The server settings did not load.')
    }
  }, [])

  useEffect(() => {
    void refresh()
    api.models.list
      .query()
      .then((listed) =>
        setCatalogue({ models: listed.models as ModelOption[], source: listed.source }),
      )
      .catch(() => {})
  }, [refresh])

  const isInstalling = settings?.pagePackages.some((row) => row.status === 'installing') ?? false
  useEffect(() => {
    if (!isInstalling) return
    const timer = setInterval(() => void refresh(), INSTALL_POLL_MS)
    return () => clearInterval(timer)
  }, [isInstalling, refresh])

  const patch = (next: Partial<ServerSettingsState>) =>
    setSettings((current) => (current ? { ...current, ...next } : current))

  // One shape for every write: the error is kept for the screen, nothing changes on a refusal.
  const attempt = async (run: () => Promise<void>) => {
    setError(null)
    try {
      await run()
    } catch (cause) {
      setError(messageOf(cause, 'That did not save. Nothing changed.'))
    }
  }

  return {
    settings,
    models: catalogue.models,
    catalogueSource: catalogue.source,
    error,
    setSignup: (mode: SignupMode) =>
      attempt(async () => {
        await api.instance.setSignup.mutate({ mode })
        patch({ signup: mode })
      }),
    saveKey: async (provider: ProviderId, key: string): Promise<string | null> => {
      try {
        await api.instance.setKey.mutate({ key, provider })
        await refresh()
        return null
      } catch (cause) {
        return messageOf(cause, 'The key did not save.')
      }
    },
    removeKey: () =>
      attempt(async () => {
        await api.instance.removeKey.mutate()
        patch({ key: null })
      }),
    setKeyModel: (model: string | null) =>
      attempt(async () => {
        await api.instance.setKeyModel.mutate({ model })
        await refresh()
      }),
    saveLentKey: async (target: LentKeyTarget, key: string): Promise<string | null> => {
      try {
        if (target === 'exa') await api.instance.setSearchKey.mutate({ key })
        else await api.instance.setUnsplashKey.mutate({ key })
        await refresh()
        return null
      } catch (cause) {
        return messageOf(cause, 'The key did not save.')
      }
    },
    removeLentKey: (target: LentKeyTarget) =>
      attempt(async () => {
        if (target === 'exa') {
          await api.instance.removeSearchKey.mutate()
          patch({ searchKey: null })
        } else {
          await api.instance.removeUnsplashKey.mutate()
          patch({ unsplashKey: null })
        }
      }),
    setHosts: async (kind: 'fetch' | 'embed', hosts: string[]): Promise<string | null> => {
      try {
        if (kind === 'fetch')
          patch({ fetchHosts: await api.instance.setFetchHosts.mutate({ hosts }) })
        else patch({ embedHosts: await api.instance.setEmbedHosts.mutate({ hosts }) })
        return null
      } catch (cause) {
        return messageOf(cause, 'The list did not save.')
      }
    },
    setWidgets: (enabled: boolean) =>
      attempt(async () => {
        patch({ widgets: await api.instance.setWidgets.mutate({ enabled }) })
      }),
    addPagePackage: async (spec: string): Promise<string | null> => {
      try {
        await api.instance.addPagePackage.mutate({ spec })
        await refresh()
        return null
      } catch (cause) {
        return messageOf(cause, 'The package was not added.')
      }
    },
    removePagePackage: (name: string) =>
      attempt(async () => {
        await api.instance.removePagePackage.mutate({ name })
        await refresh()
      }),
    setDefaults: (defaults: WorkspaceDefaultsState) =>
      attempt(async () => {
        patch({ defaults: await api.instance.setDefaults.mutate(defaults) })
      }),
  }
}
