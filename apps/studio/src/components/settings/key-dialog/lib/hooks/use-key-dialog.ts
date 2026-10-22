import { useState } from 'react'
import type { KeySave } from '../types'

/** Form state for one provider's key: the secret, whether it shows, whether a save is in flight. */
export function useKeyDialog(onSave: (key: string) => Promise<string | null>, onClose: () => void) {
  const [secret, setSecret] = useState('')
  const [view, setView] = useState({ shown: false, replacing: false })
  const [save, setSave] = useState<KeySave>({ busy: false, error: null })

  const submit = async () => {
    setSave({ busy: true, error: null })
    const error = await onSave(secret)
    setSave({ busy: false, error })
    if (!error) onClose()
  }

  return {
    secret,
    setSecret,
    shown: view.shown,
    toggleShown: () => setView((current) => ({ ...current, shown: !current.shown })),
    replacing: view.replacing,
    startReplacing: () => setView((current) => ({ ...current, replacing: true })),
    busy: save.busy,
    error: save.error,
    canSubmit: !save.busy && secret.length >= 8,
    submit,
  }
}
