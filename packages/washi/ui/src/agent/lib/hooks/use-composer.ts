import type { AttachmentRef } from '@washi/domain'
import { useState } from 'react'
import { hostUploadFile } from '../../../api'
import { useAgentStore } from '../../../stores'
import type { ComposerState } from '../types'
import { MAX_ATTACHMENTS } from '../values'

/** The draft and what rides with it. Files upload as they are picked, so Send never waits on one. */
export function useComposer() {
  const [state, setState] = useState<ComposerState>({
    draft: '',
    attachments: [],
    uploading: false,
    error: null,
  })
  const [attachOpen, setAttachOpen] = useState(false)

  const attach = (ref: AttachmentRef) =>
    setState((current) =>
      current.attachments.length >= MAX_ATTACHMENTS ||
      current.attachments.some((each) => each.id === ref.id)
        ? current
        : { ...current, attachments: [...current.attachments, ref], error: null },
    )

  const detach = (id: string) =>
    setState((current) => ({
      ...current,
      attachments: current.attachments.filter((each) => each.id !== id),
    }))

  const attachFile = async (file: File) => {
    const upload = hostUploadFile()
    if (!upload) return
    setState((current) => ({ ...current, uploading: true, error: null }))
    try {
      const stored = await upload(file)
      attach({ kind: 'file', id: stored.id, name: stored.name })
      setState((current) => ({ ...current, uploading: false }))
    } catch (cause) {
      setState((current) => ({ ...current, uploading: false, error: String(cause) }))
    }
  }

  const submit = () => {
    const { draft, attachments } = state
    if (!draft.trim() || useAgentStore.getState().running) return
    void useAgentStore.getState().sendPrompt(draft, attachments)
    setState({ draft: '', attachments: [], uploading: false, error: null })
  }

  return {
    ...state,
    setDraft: (draft: string) => setState((current) => ({ ...current, draft })),
    attach,
    attachFile,
    detach,
    submit,
    canUpload: hostUploadFile() !== null,
    attachOpen,
    setAttachOpen,
  }
}
