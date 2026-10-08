import { useState } from 'react'
import type { KeyInput } from '../types'

/** Form state only. Saving is the caller's, because first run saves more than the key. */
export function useKeyForm(onSave: (input: KeyInput) => Promise<boolean>) {
  const [provider, setProvider] = useState<string>('anthropic')
  const [model, setModel] = useState<string | null>(null)
  const [secret, setSecret] = useState('')
  const [busy, setBusy] = useState(false)

  const pickProvider = (id: string) => {
    setProvider(id)
    setModel(null)
  }

  const submit = async () => {
    setBusy(true)
    if (await onSave({ key: secret, provider, model })) setSecret('')
    setBusy(false)
  }

  return { provider, pickProvider, model, setModel, secret, setSecret, busy, submit }
}
