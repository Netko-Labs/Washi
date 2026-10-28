import { useThemesStore } from '@washi/ui'
import { useState } from 'react'
import { api } from '@/integrations/trpc'
import type { EditorDraft } from '../types'

const said = (cause: unknown, fallback: string) =>
  cause instanceof Error ? cause.message : fallback

/** The workspace's themes, from the store every page reads them from. */
export function useWorkspaceThemes() {
  const themes = useThemesStore((state) => state.themes)
  const [error, setError] = useState<string | null>(null)

  /** Answers the refusal in words, or null once it landed. */
  const save = async ({ id, name, light, dark }: EditorDraft): Promise<string | null> => {
    try {
      const write = { name, light, dark }
      if (id) await api.themes.update.mutate({ id, write })
      else await api.themes.add.mutate(write)
      await useThemesStore.getState().refresh()
      return null
    } catch (cause) {
      return said(cause, 'Could not save that theme.')
    }
  }

  const remove = async (id: string) => {
    setError(null)
    try {
      await api.themes.remove.mutate({ id })
      await useThemesStore.getState().refresh()
    } catch (cause) {
      setError(said(cause, 'Could not remove that theme.'))
    }
  }

  return { themes, error, save, remove }
}
