import type { LookPart } from '@washi/paper'
import { useWorkspaceLookStore } from '@washi/ui'
import { useState } from 'react'
import { api } from '@/integrations/trpc'
import type { OpenLookPicker } from '../types'

/** One picker open at a time; a pick saves the workspace's default and refreshes what pages wear. */
export function useWorkspaceLookEdit() {
  const [open, setOpen] = useState<OpenLookPicker | null>(null)
  const [error, setError] = useState<string | null>(null)

  const show = (part: LookPart, anchor: HTMLElement) => setOpen({ part, anchor })
  const close = () => setOpen(null)
  const pick = (part: LookPart, value: string | null) => {
    setOpen(null)
    setError(null)
    void api.workspaces.setLook
      .mutate({ [part]: value })
      .then(() => useWorkspaceLookStore.getState().refresh())
      .catch((failed: unknown) =>
        setError(failed instanceof Error ? failed.message : 'the server refused it'),
      )
  }
  return { open, error, show, close, pick }
}
