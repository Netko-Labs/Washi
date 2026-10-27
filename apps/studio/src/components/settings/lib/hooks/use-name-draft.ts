import { useEffect, useState } from 'react'

/** A name field that knows whether it changed, saves once, and says how it went. */
export function useNameDraft(initial: string, save: (name: string) => Promise<void>) {
  const [draft, setDraft] = useState(initial)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | string>('idle')

  useEffect(() => setDraft(initial), [initial])

  const trimmed = draft.trim()
  const isChanged = trimmed.length > 0 && trimmed !== initial

  const commit = async () => {
    if (!isChanged) return
    setStatus('saving')
    try {
      await save(trimmed)
      setStatus('saved')
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : String(cause))
    }
  }

  return { draft, setDraft, isChanged, status, commit }
}
