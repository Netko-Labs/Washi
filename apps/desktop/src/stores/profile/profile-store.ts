import { type Identity, useFavoritesStore, useViewStore } from '@washi/ui'
import { create } from 'zustand'
import { IDENTITY_KEY, ONBOARDED_KEY } from './constants'
import type { ProfileState } from './types'

/** The desktop has no account: who you are is what onboarding wrote down on this computer. */
function storedIdentity(): Identity {
  try {
    const stored = localStorage.getItem(IDENTITY_KEY)
    if (stored) return { name: '', email: '', color: '#c25f2c', ...JSON.parse(stored) }
  } catch {
    // fall through to defaults
  }
  return { name: '', email: '', color: '#c25f2c' }
}

useViewStore.getState().setIdentity(storedIdentity())
// One workspace on the desktop; favorites still key by it so a future second one starts clean.
useFavoritesStore.getState().bind('default')

export const useProfileStore = create<ProfileState>((set) => ({
  onboarding: localStorage.getItem(ONBOARDED_KEY) !== '1',
  finishOnboarding: () => {
    localStorage.setItem(ONBOARDED_KEY, '1')
    set({ onboarding: false })
  },
  setIdentity: (patch) => {
    useViewStore.getState().setIdentity(patch)
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(useViewStore.getState().identity))
  },
}))
