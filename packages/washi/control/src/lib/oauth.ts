import {
  oauthProviderAuthServerMetadata,
  oauthProviderOpenIdConfigMetadata,
} from '@better-auth/oauth-provider'
import type { OAuthStore } from '@washi/trpc'
import { and, asc, eq } from 'drizzle-orm'
import { createLocalJWKSet, type JSONWebKeySet, jwtVerify } from 'jose'
import { oauthClient, oauthWorkspaceGrant } from '../db'
import { mcpResource, type WashiAuth } from './auth'
import type { ControlDB } from './client'
import { OAUTH_SCOPES } from './constants'

const AUTH_SERVER = /^\/\.well-known\/oauth-authorization-server(\/api\/auth)?$/
const OPENID = /^\/\.well-known\/openid-configuration(\/api\/auth)?$/
const PROTECTED_RESOURCE = /^\/\.well-known\/oauth-protected-resource(\/mcp)?$/

/** Access tokens are the OAuth provider's JWTs, checked here against its own keys — no HTTP. */
export function createOAuthStore(db: ControlDB, auth: WashiAuth, baseUrl: string): OAuthStore {
  const resource = mcpResource(baseUrl)
  const issuer = async () => (await auth.$context).baseURL

  return {
    async verify(token) {
      try {
        const keys = createLocalJWKSet((await auth.api.getJwks()) as JSONWebKeySet)
        const { payload } = await jwtVerify(token, keys, {
          issuer: await issuer(),
          audience: resource,
        })
        const clientId = payload.client_id ?? payload.azp
        if (!payload.sub || typeof clientId !== 'string') return null
        return { actorId: payload.sub, clientId }
      } catch {
        return null
      }
    },

    async grant(actorId, clientId, workspaceIds) {
      const mine = and(
        eq(oauthWorkspaceGrant.userId, actorId),
        eq(oauthWorkspaceGrant.clientId, clientId),
      )
      // The person's answer replaces the last one whole, in the order they gave (D124).
      await db.transaction(async (tx) => {
        await tx.delete(oauthWorkspaceGrant).where(mine)
        await tx.insert(oauthWorkspaceGrant).values(
          workspaceIds.map((organizationId, position) => ({
            userId: actorId,
            clientId,
            organizationId,
            position,
          })),
        )
      })
    },

    async workspacesOf({ actorId, clientId }) {
      const rows = await db
        .select({ workspaceId: oauthWorkspaceGrant.organizationId })
        .from(oauthWorkspaceGrant)
        .where(
          and(eq(oauthWorkspaceGrant.userId, actorId), eq(oauthWorkspaceGrant.clientId, clientId)),
        )
        .orderBy(asc(oauthWorkspaceGrant.position), asc(oauthWorkspaceGrant.createdAt))
      return rows.map((row) => row.workspaceId)
    },

    async clientName(clientId) {
      const [row] = await db
        .select({ name: oauthClient.name })
        .from(oauthClient)
        .where(eq(oauthClient.clientId, clientId))
        .limit(1)
      return row ? (row.name ?? 'An agent') : null
    },

    async discovery(request) {
      const { pathname } = new URL(request.url)
      if (AUTH_SERVER.test(pathname)) return oauthProviderAuthServerMetadata(auth)(request)
      if (OPENID.test(pathname)) return oauthProviderOpenIdConfigMetadata(auth)(request)
      if (!PROTECTED_RESOURCE.test(pathname)) return null
      return Response.json({
        resource,
        resource_name: 'Washi',
        authorization_servers: [await issuer()],
        scopes_supported: [...OAUTH_SCOPES],
        bearer_methods_supported: ['header'],
      })
    },
  }
}
