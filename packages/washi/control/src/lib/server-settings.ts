import { type ServerPolicy, serverPolicySchema, workspaceDefaultsSchema } from '@washi/domain'
import { eq } from 'drizzle-orm'
import { instanceSetting, user } from '../db'
import type { ControlDB } from './client'
import { SERVER_SEAL_ID, SETTING_KEYS } from './constants'
import { open, seal } from './crypto'
import type { SealedServerKey, ServerSettings, ServerSettingsDeps, SettingRows } from './types'

function json(value: string | undefined): unknown {
  if (value === undefined) return undefined
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

/** A row that no longer parses reads as unset rather than taking the server down. */
function policyOf(values: Map<string, string>): ServerPolicy {
  const parsed = serverPolicySchema.safeParse({
    fetchHosts: json(values.get(SETTING_KEYS.fetchHosts)),
    embedHosts: json(values.get(SETTING_KEYS.embedHosts)),
    widgets: values.has(SETTING_KEYS.widgets)
      ? values.get(SETTING_KEYS.widgets) === '1'
      : undefined,
    defaults: workspaceDefaultsSchema.safeParse(json(values.get(SETTING_KEYS.defaults))).data,
  })
  return parsed.success ? parsed.data : serverPolicySchema.parse({})
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
