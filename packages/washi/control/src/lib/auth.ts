import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError } from 'better-auth/api'
import { organization } from 'better-auth/plugins'
import * as schema from '../db'
import type { ControlDB } from './client'
import { SIGNUP_REFUSED } from './constants'
import { mayCreateAccount, seedInstanceAdmin } from './instance'
import type { ControlPlaneOptions } from './types'

export type WashiAuth = ReturnType<typeof createAuth>

export function createAuth(db: ControlDB, options: ControlPlaneOptions) {
  return betterAuth({
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    baseURL: options.baseUrl,
    secret: options.masterKey,
    trustedOrigins: options.trustedOrigins ?? [],
    emailAndPassword: { enabled: true },
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
    ],
  })
}
