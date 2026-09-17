import type { Actor, ControlPlane, SecretStore, WorkspaceRef } from '@washi/trpc'
import { and, eq } from 'drizzle-orm'
import { member, organization, organizationSecret } from '../db/schema'
import { createAuth } from './auth'
import { type ControlDB, createControlDb } from './client'
import { open, seal } from './crypto'
import type { ControlPlaneOptions } from './types'

const AUTH_PREFIX = '/api/auth'

export interface HostedControlPlane extends ControlPlane {
  db: ControlDB
  secrets: SecretStore
  /** Decrypted, for the agent host only — never for a route. */
  agentKey(workspaceId: string): Promise<string | null>
  setAgentKey(workspaceId: string, actorId: string, key: string): Promise<{ last4: string }>
  agentKeyInfo(workspaceId: string): Promise<{ last4: string; updatedAt: Date } | null>
}

export function createHostedControlPlane(options: ControlPlaneOptions): HostedControlPlane {
  const { db, close } = createControlDb(options.databaseUrl)
  const auth = createAuth(db, options)

  const plane: HostedControlPlane = {
    db,
    secrets: {
      info: (workspaceId) => plane.agentKeyInfo(workspaceId),
      set: (workspaceId, actorId, key) => plane.setAgentKey(workspaceId, actorId, key),
    },

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
      return open(options.masterKey, workspaceId, row)
    },

    async setAgentKey(workspaceId, actorId, key) {
      const sealed = await seal(options.masterKey, workspaceId, key)
      await db
        .insert(organizationSecret)
        .values({
          organizationId: workspaceId,
          ciphertext: sealed.ciphertext,
          iv: sealed.iv,
          last4: sealed.last4,
          updatedBy: actorId,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: organizationSecret.organizationId,
          set: {
            ciphertext: sealed.ciphertext,
            iv: sealed.iv,
            last4: sealed.last4,
            updatedBy: actorId,
            updatedAt: new Date(),
          },
        })
      return { last4: sealed.last4 }
    },

    async agentKeyInfo(workspaceId) {
      const [row] = await db
        .select({ last4: organizationSecret.last4, updatedAt: organizationSecret.updatedAt })
        .from(organizationSecret)
        .where(eq(organizationSecret.organizationId, workspaceId))
        .limit(1)
      return row ?? null
    },

    close,
  }

  return plane
}
