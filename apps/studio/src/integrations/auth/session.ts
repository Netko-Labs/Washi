import { auth } from './client'
import type { Session, SessionStore } from './types'

let isHeld = false

/**
 * The session `useSession` shares, so a loader and the hooks after it make one get-session.
 * The store stays mounted from here on: a hook mounting later would otherwise fetch again.
 */
export function readSession(): Promise<Session | null> {
  const store: SessionStore | undefined = auth.$store.atoms.session
  if (!store) return auth.getSession().then(({ data }) => data)
  if (!isHeld) {
    isHeld = true
    store.listen(() => {})
  }
  return new Promise((resolve) => {
    let isSettled = false
    let stop: (() => void) | null = null
    stop = store.subscribe((state) => {
      if (state.isPending || isSettled) return
      isSettled = true
      resolve(state.data)
      stop?.()
    })
    if (isSettled) stop()
  })
}
