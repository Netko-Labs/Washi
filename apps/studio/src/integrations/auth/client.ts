import { oauthProviderClient } from '@better-auth/oauth-provider/client'
import { organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

/**
 * Same origin as the page, so the session cookie needs no CORS. A workspace is an organization,
 * so creating one is `organization.create` rather than anything Washi-specific. The OAuth client
 * carries a signed authorization request from the page's query through sign-in and consent (D101).
 */
export const auth = createAuthClient({ plugins: [organizationClient(), oauthProviderClient()] })

export const { useSession, signIn, signUp, signOut } = auth
