import { useState } from 'react'
import { readActiveWorkspace } from '@/integrations/trpc'
import type { UploadState } from '../types'

/** One file to `/api/files`; the page then stores `file:<id>`. Refusals come back in words. */
export function useCoverUpload(onPick: (cover: string) => void) {
  const [state, setState] = useState<UploadState>({ busy: false, error: null })

  const upload = async (file: File) => {
    setState({ busy: true, error: null })
    const workspace = readActiveWorkspace() ?? ''
    const body = new FormData()
    body.set('file', file)
    try {
      const response = await fetch(`/api/files?workspace=${encodeURIComponent(workspace)}`, {
        method: 'POST',
        body,
      })
      if (!response.ok) {
        const reason = ((await response.json().catch(() => null)) as { error?: string } | null)
          ?.error
        setState({ busy: false, error: reason ?? 'That did not upload.' })
        return
      }
      const stored = (await response.json()) as { id: string }
      setState({ busy: false, error: null })
      onPick(`file:${stored.id}`)
    } catch {
      setState({ busy: false, error: 'That did not upload.' })
    }
  }

  return { ...state, upload }
}
