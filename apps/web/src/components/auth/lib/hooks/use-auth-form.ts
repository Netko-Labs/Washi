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
    const result =
      mode === 'sign-up'
        ? await signUp.email({ email, password, name: name || email.split('@')[0] || 'You' })
        : await signIn.email({ email, password })

    if (result.error) {
      patch({ busy: false, error: result.error.message ?? 'That did not work.' })
      return
    }
    patch({ busy: false })
    onDone()
  }

  return { state, patch, setMode, submit }
}
