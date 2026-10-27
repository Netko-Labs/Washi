import { hostUploadFile } from '@washi/ui'
import { useCallback, useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'
import type { CustomEmojiView } from '../types'

/** The workspace's own emojis. An add uploads the picture first and drops it again if refused. */
export function useCustomEmojis() {
  const [emojis, setEmojis] = useState<CustomEmojiView[]>([])
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setEmojis(await api.emojis.list.query())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load this workspace’s emojis.')
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const add = async (name: string, file: File): Promise<CustomEmojiView> => {
    const send = hostUploadFile()
    if (!send) throw new Error('This app stores no pictures.')
    const stored = await send(file)
    try {
      const emoji = await api.emojis.add.mutate({ name, fileId: stored.id })
      await refresh()
      return emoji
    } catch (cause) {
      await api.files.remove.mutate({ id: stored.id }).catch(() => {})
      throw cause
    }
  }

  const remove = async (id: string) => {
    setError(null)
    try {
      await api.emojis.remove.mutate({ id })
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not remove that emoji.')
    }
  }

  return { emojis, error, add, remove }
}
