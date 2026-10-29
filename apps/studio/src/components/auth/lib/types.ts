export type AuthMode = 'sign-in' | 'sign-up'

export interface AuthFormState {
  mode: AuthMode
  name: string
  email: string
  password: string
  error: string | null
  busy: boolean
}

export interface AuthScreenProps {
  onDone: () => void
}

export interface AuthFieldProps {
  label: string
  type: string
  value: string
  autoComplete: string
  onChange: (value: string) => void
}
