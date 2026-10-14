import type { Identity } from '@washi/ui'

export interface ProfileState {
  onboarding: boolean
  finishOnboarding: () => void
  setIdentity: (patch: Partial<Identity>) => void
}
