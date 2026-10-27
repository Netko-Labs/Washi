import type { StorageConfig, StorageInfo } from '@washi/trpc'
import { eq } from 'drizzle-orm'
import { organizationStorage, user } from '../db/schema'
import type { ControlDB } from './client'
import { open, seal } from './crypto'
import type { HostedStorageStore, StorageKeys } from './types'

/** Opened once per workspace and held until it changes; every file read asks. */
export function createStorageStore(db: ControlDB, masterKey: string): HostedStorageStore {
  const opened = new Map<string, Promise<StorageConfig | null>>()

  const load = async (workspaceId: string): Promise<StorageConfig | null> => {
    const [row] = await db
      .select()
      .from(organizationStorage)
      .where(eq(organizationStorage.organizationId, workspaceId))
      .limit(1)
    if (!row) return null
    const keys = JSON.parse(await open(masterKey, workspaceId, row)) as StorageKeys
    return {
      endpoint: row.endpoint,
      region: row.region,
      bucket: row.bucket,
      prefix: row.prefix,
      ...keys,
    }
  }

  const store: HostedStorageStore = {
    config(workspaceId) {
      const cached = opened.get(workspaceId)
      if (cached) return cached
      const pending = load(workspaceId)
      opened.set(workspaceId, pending)
      pending.catch(() => opened.delete(workspaceId))
      return pending
    },

    async info(workspaceId) {
      const [row] = await db
        .select({
          endpoint: organizationStorage.endpoint,
          region: organizationStorage.region,
          bucket: organizationStorage.bucket,
          prefix: organizationStorage.prefix,
          accessKeyLast4: organizationStorage.keyLast4,
          updatedAt: organizationStorage.updatedAt,
          updatedBy: user.name,
        })
        .from(organizationStorage)
        .leftJoin(user, eq(user.id, organizationStorage.updatedBy))
        .where(eq(organizationStorage.organizationId, workspaceId))
        .limit(1)
      return (row ?? null) satisfies StorageInfo | null
    },

    async set(workspaceId, actorId, config) {
      const keys: StorageKeys = {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      }
      const sealed = await seal(masterKey, workspaceId, JSON.stringify(keys))
      const row = {
        endpoint: config.endpoint,
        region: config.region,
        bucket: config.bucket,
        prefix: config.prefix,
        ciphertext: sealed.ciphertext,
        iv: sealed.iv,
        keyLast4: config.accessKeyId.slice(-4),
        updatedBy: actorId,
        updatedAt: new Date(),
      }
      await db
        .insert(organizationStorage)
        .values({ organizationId: workspaceId, ...row })
        .onConflictDoUpdate({ target: organizationStorage.organizationId, set: row })
      opened.delete(workspaceId)
      const info = await store.info(workspaceId)
      if (!info) throw new Error('the storage settings did not save')
      return info
    },

    async remove(workspaceId) {
      await db
        .delete(organizationStorage)
        .where(eq(organizationStorage.organizationId, workspaceId))
      opened.delete(workspaceId)
    },
  }

  return store
}
