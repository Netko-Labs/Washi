import { z } from 'zod'

/** What a person calls a token, so they know which agent holds it. */
export const accessTokenNameSchema = z.string().trim().min(1).max(60)

/** A token as its owner may read it back: never the secret, only its last four. */
export interface AccessTokenInfo {
  id: string
  name: string
  last4: string
  createdAt: string
  lastUsedAt: string | null
}

/** The one time the secret is shown: when it is made. */
export interface IssuedAccessToken {
  token: string
  info: AccessTokenInfo
}
