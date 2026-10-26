import { useSheetsStore } from '@washi/ui'
import { useCallback, useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'
import type { Audience, ShareSettings } from '../types'

/** One page's sharing: read it, change who reads it, keep the tree in step. */
export function useShare(sheetId: string) {
  const [settings, setSettings] = useState<ShareSettings | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    () =>
      api.sheets.share
        .query({ id: sheetId })
        .then(setSettings)
        .catch((cause: unknown) =>
          setError(cause instanceof Error ? cause.message : String(cause)),
        ),
    [sheetId],
  )

  useEffect(() => {
    void load()
  }, [load])

  const apply = async (visibility: Audience, access: string[]) => {
    setBusy(true)
    setError(null)
    try {
      await api.sheets.setAccess.mutate({ id: sheetId, visibility, access })
      await Promise.all([load(), useSheetsStore.getState().refresh()])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  return { settings, busy, error, apply }
}
