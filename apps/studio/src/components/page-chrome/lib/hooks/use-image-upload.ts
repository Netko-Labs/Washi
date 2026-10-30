import { uploadRefusal } from '@washi/domain'
import { hostUploadFile } from '@washi/ui'
import { useState } from 'react'
import { api } from '@/integrations/trpc'
import type { UploadState } from '../types'

/** One picture into the files store; the page then wears `file:<id>`. Refusals come back in words. */
export function useImageUpload(onPick: (key: string) => void) {
  const [state, setState] = useState<UploadState>({ busy: false, error: null })

  const upload = async (file: File) => {
    const send = hostUploadFile()
    if (!send) return
    // The server takes videos and documents too; a cover or an icon is a picture.
    const caps = await api.files.caps.query().catch(() => undefined)
    const refused = uploadRefusal(file.type, file.size, 'image', caps)
    if (refused) {
      setState({ busy: false, error: refused })
      return
    }
    setState({ busy: true, error: null })
    try {
      const stored = await send(file)
      setState({ busy: false, error: null })
      onPick(`file:${stored.id}`)
    } catch (error) {
      setState({
        busy: false,
        error: error instanceof Error ? error.message : 'That did not upload.',
      })
    }
  }

  return { ...state, upload }
}
