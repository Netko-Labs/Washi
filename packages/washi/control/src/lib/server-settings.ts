import { type ServerPolicy, serverPolicySchema, workspaceDefaultsSchema } from '@washi/domain'
import { eq } from 'drizzle-orm'
import { instanceSetting, user } from '../db'
import type { ControlDB } from './client'
import { SERVER_SEAL_ID, SERVER_SEARCH_SEAL_ID, SETTING_KEYS } from './constants'
import { open, seal } from './crypto'
import type {
  SealedSearchKey,
  SealedServerKey,
  ServerSettings,
  ServerSettingsDeps,
  SettingRows,
} from './types'

function json(value: string | undefined): unknown {
  if (value === undefined) return undefined
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

/**
 * Each row parses on its own: one that no longer reads falls back alone, never taking the others
 * with it. Widgets fail closed — a switch that can't be read is off, not on.
 */
function policyOf(values: Map<string, string>): ServerPolicy {
  const field = serverPolicySchema.shape
  const widgets = values.get(SETTING_KEYS.widgets)
  return {
    fetchHosts: field.fetchHosts.safeParse(json(values.get(SETTING_KEYS.fetchHosts))).data ?? [],
    embedHosts: field.embedHosts.safeParse(json(values.get(SETTING_KEYS.embedHosts))).data ?? [],
    widgets: widgets === undefined ? true : widgets === '1',
    defaults:
      workspaceDefaultsSchema.safeParse(json(values.get(SETTING_KEYS.defaults))).data ??
      workspaceDefaultsSchema.parse({}),
  }
}

export function createServerSettings({
  rows,
  masterKey,
  nameOf,
}: ServerSettingsDeps): ServerSettings {
  let policy = serverPolicySchema.parse({})
  const values = new Map<string, string>()

  const write = async (key: string, value: string) => {
    await rows.put(key, value)
    values.set(key, value)
    policy = policyOf(values)
  }

  const sealedKey = async (): Promise<SealedServerKey | null> => {
    const stored = json((await rows.get(SETTING_KEYS.agentKey)) ?? undefined)
    return stored ? (stored as SealedServerKey) : null
  }

  const sealedSearchKey = async (): Promise<SealedSearchKey | null> => {
    const stored = json((await rows.get(SETTING_KEYS.searchKey)) ?? undefined)
    return stored ? (stored as SealedSearchKey) : null
  }

  return {
    async load() {
      values.clear()
      for (const row of await rows.all()) values.set(row.key, row.value)
      policy = policyOf(values)
    },
    policy: () => policy,
    setFetchHosts: (hosts) => write(SETTING_KEYS.fetchHosts, JSON.stringify(hosts)),
    setEmbedHosts: (hosts) => write(SETTING_KEYS.embedHosts, JSON.stringify(hosts)),
    setWidgets: (enabled) => write(SETTING_KEYS.widgets, enabled ? '1' : '0'),
    setDefaults: (defaults) => write(SETTING_KEYS.defaults, JSON.stringify(defaults)),

    async agentKey() {
      const row = await sealedKey()
      if (!row) return null
      return {
        apiKey: await open(masterKey, SERVER_SEAL_ID, row),
        provider: row.provider,
        model: row.model,
      }
    },
    async keyInfo() {
      const row = await sealedKey()
      if (!row) return null
      return {
        last4: row.last4,
        provider: row.provider,
        model: row.model,
        updatedAt: new Date(row.updatedAt),
        updatedBy: row.updatedBy ? await nameOf(row.updatedBy) : null,
      }
    },
    async setKey(actorId, credential) {
      const sealed = await seal(masterKey, SERVER_SEAL_ID, credential.key)
      const row: SealedServerKey = {
        ...sealed,
        provider: credential.provider,
        model: credential.model ?? null,
        updatedBy: actorId,
        updatedAt: new Date().toISOString(),
      }
      await rows.put(SETTING_KEYS.agentKey, JSON.stringify(row))
      return { last4: sealed.last4 }
    },
    async setKeyModel(actorId, model) {
      const row = await sealedKey()
      if (!row) return
      const next = { ...row, model, updatedBy: actorId, updatedAt: new Date().toISOString() }
      await rows.put(SETTING_KEYS.agentKey, JSON.stringify(next))
    },
    removeKey: () => rows.drop(SETTING_KEYS.agentKey),

    async searchKey() {
      const row = await sealedSearchKey()
      return row ? open(masterKey, SERVER_SEARCH_SEAL_ID, row) : null
    },
    async searchKeyInfo() {
      const row = await sealedSearchKey()
      if (!row) return null
      return {
        last4: row.last4,
        updatedAt: new Date(row.updatedAt),
        updatedBy: row.updatedBy ? await nameOf(row.updatedBy) : null,
      }
    },
    async setSearchKey(actorId, key) {
      const sealed = await seal(masterKey, SERVER_SEARCH_SEAL_ID, key)
      const row: SealedSearchKey = {
        ...sealed,
        updatedBy: actorId,
        updatedAt: new Date().toISOString(),
      }
      await rows.put(SETTING_KEYS.searchKey, JSON.stringify(row))
      return { last4: sealed.last4 }
    },
    removeSearchKey: () => rows.drop(SETTING_KEYS.searchKey),
  }
}

export function settingRows(db: ControlDB): SettingRows {
  return {
    all: () =>
      db.select({ key: instanceSetting.key, value: instanceSetting.value }).from(instanceSetting),
    async get(key) {
      const [row] = await db
        .select({ value: instanceSetting.value })
        .from(instanceSetting)
        .where(eq(instanceSetting.key, key))
        .limit(1)
      return row?.value ?? null
    },
    async put(key, value) {
      const row = { value, updatedAt: new Date() }
      await db
        .insert(instanceSetting)
        .values({ key, ...row })
        .onConflictDoUpdate({ target: instanceSetting.key, set: row })
    },
    async drop(key) {
      await db.delete(instanceSetting).where(eq(instanceSetting.key, key))
    },
  }
}

export async function userName(db: ControlDB, userId: string): Promise<string | null> {
  const [row] = await db.select({ name: user.name }).from(user).where(eq(user.id, userId)).limit(1)
  return row?.name ?? null
}
