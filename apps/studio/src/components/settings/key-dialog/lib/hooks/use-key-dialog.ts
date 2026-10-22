import { useState } from 'react'

/** Form state for one provider's key: the secret, whether it shows, whether a save is in flight. */
export function useKeyDialog(onSave: (key: string) => Promise<boolean>, onClose: () => void) {
  const [secret, setSecret] = useState('')
  const [view, setView] = useState({ shown: false, replacing: false })
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    const saved = await onSave(secret)
    setBusy(false)
    if (saved) onClose()
  }

  return {
    secret,
    setSecret,
    shown: view.shown,
    toggleShown: () => setView((current) => ({ ...current, shown: !current.shown })),
    replacing: view.replacing,
    startReplacing: () => setView((current) => ({ ...current, replacing: true })),
    busy,
    canSubmit: !busy && secret.length >= 8,
    submit,
  }
}
