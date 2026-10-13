import { organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

/**
 * Same origin as the page, so the session cookie needs no CORS. A workspace is an organization,
 * so creating one is `organization.create` rather than anything Washi-specific.
 */
export const auth = createAuthClient({ plugins: [organizationClient()] })

export const { useSession, signIn, signUp, signOut } = auth
