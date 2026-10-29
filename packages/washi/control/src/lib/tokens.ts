import type { AccessTokenInfo, TokenStore } from '@washi/trpc'
import { and, desc, eq } from 'drizzle-orm'
import { accessToken } from '../db'
import type { ControlDB } from './client'
import { TOKEN_BYTES, TOKEN_PREFIX, TOKEN_USE_GRAIN_MS } from './constants'

const hashOf = (token: string) => new Bun.CryptoHasher('sha256').update(token).digest('hex')

function mint(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(TOKEN_BYTES))
  return `${TOKEN_PREFIX}${Buffer.from(bytes).toString('base64url')}`
}

const infoOf = (row: typeof accessToken.$inferSelect): AccessTokenInfo => ({
  id: row.id,
  name: row.name,
  last4: row.last4,
  createdAt: row.createdAt.toISOString(),
  lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
})

/** Tokens kept only as their hash: shown once when made, never readable after. */
export function createTokenStore(db: ControlDB): TokenStore {
  return {
    async list(actorId, workspaceId) {
      const rows = await db
        .select()
        .from(accessToken)
        .where(and(eq(accessToken.userId, actorId), eq(accessToken.organizationId, workspaceId)))
        .orderBy(desc(accessToken.createdAt))
      return rows.map(infoOf)
    },

    async create(actorId, workspaceId, name) {
      const token = mint()
      const [row] = await db
        .insert(accessToken)
        .values({
          id: Bun.randomUUIDv7(),
          userId: actorId,
          organizationId: workspaceId,
          name,
          tokenHash: hashOf(token),
          last4: token.slice(-4),
        })
        .returning()
      if (!row) throw new Error('the token was not kept')
      return { token, info: infoOf(row) }
    },

    async revoke(actorId, id) {
      await db
        .delete(accessToken)
        .where(and(eq(accessToken.id, id), eq(accessToken.userId, actorId)))
    },

    async verify(token) {
      if (!token.startsWith(TOKEN_PREFIX)) return null
      const [row] = await db
        .select()
        .from(accessToken)
        .where(eq(accessToken.tokenHash, hashOf(token)))
        .limit(1)
      if (!row) return null
      const now = new Date()
      if (!row.lastUsedAt || now.getTime() - row.lastUsedAt.getTime() > TOKEN_USE_GRAIN_MS) {
        await db.update(accessToken).set({ lastUsedAt: now }).where(eq(accessToken.id, row.id))
      }
      return { actorId: row.userId, workspaceId: row.organizationId }
    },
  }
}
