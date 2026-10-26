import { useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'
import type { SignupMode } from '../types'

export function useServerSettings() {
  const [signup, setSignupState] = useState<SignupMode | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.instance.settings
      .query()
      .then((settings) => setSignupState(settings.signup))
      .catch(() => setError('The server settings did not load.'))
  }, [])

  const setSignup = async (mode: SignupMode) => {
    const before = signup
    setSignupState(mode)
    setError(null)
    try {
      await api.instance.setSignup.mutate({ mode })
    } catch {
      setSignupState(before)
      setError('That did not save. Nothing changed.')
    }
  }

  return { signup, setSignup, error }
}
