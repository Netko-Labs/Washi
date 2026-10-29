import { oauthProvider } from '@better-auth/oauth-provider'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError } from 'better-auth/api'
import { jwt, organization } from 'better-auth/plugins'
import * as schema from '../db'
import type { ControlDB } from './client'
import { CONSENT_PAGE, OAUTH_SCOPES, SIGN_IN_PAGE, SIGNUP_REFUSED } from './constants'
import { mayCreateAccount, seedInstanceAdmin } from './instance'
import type { ControlPlaneOptions } from './types'

export type WashiAuth = ReturnType<typeof createAuth>

/** The one resource an OAuth grant is for: this server's MCP address (D101). */
export const mcpResource = (baseUrl: string) => `${baseUrl.replace(/\/+$/, '')}/mcp`

export function createAuth(db: ControlDB, options: ControlPlaneOptions) {
  const resource = mcpResource(options.baseUrl)
  return betterAuth({
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    baseURL: options.baseUrl,
    secret: options.masterKey,
    trustedOrigins: options.trustedOrigins ?? [],
    emailAndPassword: { enabled: true },
    // OAuth issues access tokens; the JWT plugin's own session-token endpoint must not.
    disabledPaths: ['/token'],
    databaseHooks: {
      user: {
        create: {
          before: async (account) => {
            if (!(await mayCreateAccount(db, account.email))) {
              throw new APIError('FORBIDDEN', { message: SIGNUP_REFUSED })
            }
          },
          after: () => seedInstanceAdmin(db),
        },
      },
    },
    plugins: [
      organization({
        // A workspace is an organization, so creating one is the normal path,
        // not an admin action. Teams stay off: Notion teamspaces are a second
        // nesting level before there are two users.
        allowUserToCreateOrganization: true,
        teams: { enabled: false },
      }),
      jwt({ disableSettingJwtHeader: true }),
      // An outside agent signs in as a person, who picks the workspace on consent (D101). Claude
      // Code registers itself (dynamic, public, PKCE) and may only ask for the MCP resource.
      oauthProvider({
        loginPage: SIGN_IN_PAGE,
        consentPage: CONSENT_PAGE,
        scopes: [...OAUTH_SCOPES],
        resources: [resource],
        allowDynamicClientRegistration: true,
        allowUnauthenticatedClientRegistration: true,
        clientRegistrationDefaultApplicationType: 'infer',
        clientRegistrationDefaultResources: [resource],
        clientRegistrationAllowedResources: [resource],
      }),
    ],
  })
}
