import type { SIGNUP_MODES } from './values'

export type SignupMode = (typeof SIGNUP_MODES)[number]

/** The server's own settings, held by its app admins (its first account). Absent in embedded mode. */
export interface InstanceStore {
  isAdmin(actorId: string): Promise<boolean>
  signup(): Promise<SignupMode>
  setSignup(mode: SignupMode): Promise<void>
}
