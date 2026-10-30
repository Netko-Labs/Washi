import type { auth } from './client'

export type Session = typeof auth.$Infer.Session

export interface SessionState {
  data: Session | null
  isPending: boolean
}

export interface SessionStore {
  subscribe(listener: (state: SessionState) => void): () => void
  listen(listener: () => void): () => void
}
