import { organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { SERVER_URL } from './constants'

/**
 * Sessions are cookies set by the server, so every call is credentialed and the
 * server's CORS reflects this origin back. A workspace is an organization, so
 * creating one is `organization.create` rather than anything Washi-specific.
 */
export const auth = createAuthClient({
  baseURL: SERVER_URL,
  fetchOptions: { credentials: 'include' },
  plugins: [organizationClient()],
})

export const { useSession, signIn, signUp, signOut } = auth
