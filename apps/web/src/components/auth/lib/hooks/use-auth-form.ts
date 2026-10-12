import { useState } from 'react'
import { signIn, signUp } from '@/lib/auth'
import type { AuthFormState, AuthMode } from '../types'

const INITIAL: AuthFormState = {
  mode: 'sign-in',
  name: '',
  email: '',
  password: '',
  error: null,
  busy: false,
}

export function useAuthForm(onDone: () => void) {
  const [state, setState] = useState<AuthFormState>(INITIAL)
  const patch = (next: Partial<AuthFormState>) => setState((prev) => ({ ...prev, ...next }))

  const setMode = (mode: AuthMode) => patch({ mode, error: null })

  const submit = async () => {
    patch({ busy: true, error: null })
    const { email, password, name, mode } = state
    try {
      const result =
        mode === 'sign-up'
          ? await signUp.email({ email, password, name: name || email.split('@')[0] || 'You' })
          : await signIn.email({ email, password })

      if (result.error) {
        patch({ error: result.error.message ?? 'That did not work.' })
        return
      }
      onDone()
    } catch (cause) {
      patch({ error: cause instanceof Error ? cause.message : String(cause) })
    } finally {
      patch({ busy: false })
    }
  }

  return { state, patch, setMode, submit }
}
