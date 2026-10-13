export type AuthMode = 'sign-in' | 'sign-up'

export interface AuthFormState {
  mode: AuthMode
  name: string
  email: string
  password: string
  error: string | null
  busy: boolean
}
