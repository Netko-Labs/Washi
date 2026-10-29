import type {
  Actor,
  AgentCredentialInput,
  ControlPlane,
  InstanceStore,
  Integration,
  SecretStore,
  TokenStore,
  WorkspaceRef,
} from '@washi/trpc'

export interface AgentCredentialOut {
  apiKey: string
  provider: string
  model: string | null
}

import { and, eq } from 'drizzle-orm'
import { member, organization, organizationIntegration, organizationSecret, user } from '../db'
import { createAuth } from './auth'
import { type ControlDB, createControlDb } from './client'
import { open, seal } from './crypto'
import { isInstanceAdmin, setSignupMode, signupMode } from './instance'
import { createStorageStore } from './storage'
import { createTokenStore } from './tokens'
import type { ControlPlaneOptions, HostedStorageStore } from './types'

const AUTH_PREFIX = '/api/auth'

export interface HostedControlPlane extends ControlPlane {
  db: ControlDB
  secrets: SecretStore
  instance: InstanceStore
  storage: HostedStorageStore
  tokens: TokenStore
  /** Decrypted, for the agent host only — never for a route. */
  agentKey(workspaceId: string): Promise<AgentCredentialOut | null>
  setAgentKey(
    workspaceId: string,
    actorId: string,
    credential: AgentCredentialInput,
  ): Promise<{ last4: string }>
  setAgentModel(workspaceId: string, actorId: string, model: string | null): Promise<void>
  removeAgentKey(workspaceId: string): Promise<void>
  agentKeyInfo(workspaceId: string): Promise<{
    last4: string
    provider: string
    model: string | null
    updatedAt: Date
    updatedBy: string | null
  } | null>
  /** Decrypted, for the agent host only — never for a route. */
  integrationKey(workspaceId: string, integration: Integration): Promise<string | null>
  setIntegrationKey(
    workspaceId: string,
    actorId: string,
    integration: Integration,
    key: string,
  ): Promise<{ last4: string }>
  integrationKeyInfo(
    workspaceId: string,
    integration: Integration,
  ): Promise<{ last4: string; updatedAt: Date } | null>
  removeIntegrationKey(workspaceId: string, integration: Integration): Promise<void>
}

export function createHostedControlPlane(options: ControlPlaneOptions): HostedControlPlane {
  const { db, close } = createControlDb(options.databaseUrl)
  const auth = createAuth(db, options)

  const plane: HostedControlPlane = {
    db,
    secrets: {
      info: (workspaceId) => plane.agentKeyInfo(workspaceId),
      set: (workspaceId, actorId, credential) =>
        plane.setAgentKey(workspaceId, actorId, credential),
      setModel: (workspaceId, actorId, model) => plane.setAgentModel(workspaceId, actorId, model),
      remove: (workspaceId) => plane.removeAgentKey(workspaceId),
      removeIntegration: (workspaceId, integration) =>
        plane.removeIntegrationKey(workspaceId, integration),
      integrationInfo: (workspaceId, integration) =>
        plane.integrationKeyInfo(workspaceId, integration),
      setIntegration: (workspaceId, actorId, integration, key) =>
        plane.setIntegrationKey(workspaceId, actorId, integration, key),
    },
    instance: {
      isAdmin: (actorId) => isInstanceAdmin(db, actorId),
      signup: () => signupMode(db),
      setSignup: (mode) => setSignupMode(db, mode),
    },
    storage: createStorageStore(db, options.masterKey),
    tokens: createTokenStore(db),

    async authenticate(request) {
      const result = await auth.api.getSession({ headers: request.headers })
      if (!result?.user) return null
      const actor: Actor = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      }
      return actor
    },

    async authorize(actorId, workspaceId) {
      if (!actorId) return false
      const rows = await db
        .select({ id: member.id })
        .from(member)
        .where(and(eq(member.userId, actorId), eq(member.organizationId, workspaceId)))
        .limit(1)
      return rows.length > 0
    },

    async listWorkspaces(actorId) {
      if (!actorId) return []
      const rows = await db
        .select({ id: organization.id, name: organization.name, role: member.role })
        .from(member)
        .innerJoin(organization, eq(organization.id, member.organizationId))
        .where(eq(member.userId, actorId))
      return rows satisfies WorkspaceRef[]
    },

    async listMembers(workspaceId) {
      return db
        .select({ id: user.id, name: user.name })
        .from(member)
        .innerJoin(user, eq(user.id, member.userId))
        .where(eq(member.organizationId, workspaceId))
    },

    async workspaceIds() {
      const rows = await db.select({ id: organization.id }).from(organization)
      return rows.map((row) => row.id)
    },

    async handle(request) {
      const url = new URL(request.url)
      if (!url.pathname.startsWith(AUTH_PREFIX)) return null
      return auth.handler(request)
    },

    async agentKey(workspaceId) {
      const [row] = await db
        .select()
        .from(organizationSecret)
        .where(eq(organizationSecret.organizationId, workspaceId))
        .limit(1)
      if (!row) return null
      return {
        apiKey: await open(options.masterKey, workspaceId, row),
        provider: row.provider,
        model: row.model,
      }
    },

    async setAgentKey(workspaceId, actorId, credential) {
      const sealed = await seal(options.masterKey, workspaceId, credential.key)
      const row = {
        provider: credential.provider,
        model: credential.model ?? null,
        ciphertext: sealed.ciphertext,
        iv: sealed.iv,
        last4: sealed.last4,
        updatedBy: actorId,
        updatedAt: new Date(),
      }
      await db
        .insert(organizationSecret)
        .values({ organizationId: workspaceId, ...row })
        .onConflictDoUpdate({ target: organizationSecret.organizationId, set: row })
      return { last4: sealed.last4 }
    },

    async setAgentModel(workspaceId, actorId, model) {
      await db
        .update(organizationSecret)
        .set({ model, updatedBy: actorId, updatedAt: new Date() })
        .where(eq(organizationSecret.organizationId, workspaceId))
    },

    async removeAgentKey(workspaceId) {
      await db.delete(organizationSecret).where(eq(organizationSecret.organizationId, workspaceId))
    },

    async agentKeyInfo(workspaceId) {
      const [row] = await db
        .select({
          last4: organizationSecret.last4,
          provider: organizationSecret.provider,
          model: organizationSecret.model,
          updatedAt: organizationSecret.updatedAt,
          updatedBy: user.name,
        })
        .from(organizationSecret)
        .leftJoin(user, eq(user.id, organizationSecret.updatedBy))
        .where(eq(organizationSecret.organizationId, workspaceId))
        .limit(1)
      return row ?? null
    },

    async integrationKey(workspaceId, integration) {
      const [row] = await db
        .select()
        .from(organizationIntegration)
        .where(
          and(
            eq(organizationIntegration.organizationId, workspaceId),
            eq(organizationIntegration.integration, integration),
          ),
        )
        .limit(1)
      return row ? open(options.masterKey, workspaceId, row) : null
    },

    async setIntegrationKey(workspaceId, actorId, integration, key) {
      const sealed = await seal(options.masterKey, workspaceId, key)
      const row = {
        ciphertext: sealed.ciphertext,
        iv: sealed.iv,
        last4: sealed.last4,
        updatedBy: actorId,
        updatedAt: new Date(),
      }
      await db
        .insert(organizationIntegration)
        .values({ organizationId: workspaceId, integration, ...row })
        .onConflictDoUpdate({
          target: [organizationIntegration.organizationId, organizationIntegration.integration],
          set: row,
        })
      return { last4: sealed.last4 }
    },

    async integrationKeyInfo(workspaceId, integration) {
      const [row] = await db
        .select({
          last4: organizationIntegration.last4,
          updatedAt: organizationIntegration.updatedAt,
        })
        .from(organizationIntegration)
        .where(
          and(
            eq(organizationIntegration.organizationId, workspaceId),
            eq(organizationIntegration.integration, integration),
          ),
        )
        .limit(1)
      return row ?? null
    },

    async removeIntegrationKey(workspaceId, integration) {
      await db
        .delete(organizationIntegration)
        .where(
          and(
            eq(organizationIntegration.organizationId, workspaceId),
            eq(organizationIntegration.integration, integration),
          ),
        )
    },

    close,
  }

  return plane
}
