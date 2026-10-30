import {
  ANY_HOST,
  CODE_LIMITS,
  type CodeLimit,
  readCodeLimits,
  readSafeguards,
  type SafeguardChange,
  type ServerPolicy,
  serverPolicySchema,
  workspaceDefaultsSchema,
} from '@washi/domain'
import { eq } from 'drizzle-orm'
import { instanceSetting, user } from '../db'
import type { ControlDB } from './client'
import {
  SAFEGUARD_LOG_KEPT,
  SERVER_SEAL_ID,
  SERVER_SEARCH_SEAL_ID,
  SERVER_UNSPLASH_SEAL_ID,
  SETTING_KEYS,
} from './constants'
import { open, seal } from './crypto'
import type {
  HostList,
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
 * with it. Widgets and safeguards fail closed — a switch that can't be read keeps the guard.
 */
function policyOf(values: Map<string, string>): ServerPolicy {
  const field = serverPolicySchema.shape
  const widgets = values.get(SETTING_KEYS.widgets)
  return {
    fetchHosts: field.fetchHosts.safeParse(json(values.get(SETTING_KEYS.fetchHosts))).data ?? [],
    embedHosts: field.embedHosts.safeParse(json(values.get(SETTING_KEYS.embedHosts))).data ?? [],
    widgetHosts: field.widgetHosts.safeParse(json(values.get(SETTING_KEYS.widgetHosts))).data ?? [],
    widgets: widgets === undefined ? true : widgets === '1',
    defaults:
      workspaceDefaultsSchema.safeParse(json(values.get(SETTING_KEYS.defaults))).data ??
      workspaceDefaultsSchema.parse({}),
    pagePackages:
      field.pagePackages.safeParse(json(values.get(SETTING_KEYS.pagePackages))).data ?? [],
    safeguards: readSafeguards(json(values.get(SETTING_KEYS.safeguards))),
    limits: readCodeLimits(json(values.get(SETTING_KEYS.limits))),
  }
}

function changesOf(value: string | undefined): SafeguardChange[] {
  const stored = json(value)
  return Array.isArray(stored) ? (stored as SafeguardChange[]) : []
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

  const logChange = (change: Omit<SafeguardChange, 'at'>) => {
    const log = [
      ...changesOf(values.get(SETTING_KEYS.safeguardLog)),
      { ...change, at: new Date().toISOString() },
    ]
    return write(SETTING_KEYS.safeguardLog, JSON.stringify(log.slice(-SAFEGUARD_LOG_KEPT)))
  }

  /** A list that gains or loses `*` lifts or restores a guard, so the trail notes it. */
  const writeHosts = async (actorId: string, list: HostList, hosts: string[]) => {
    const wasAny = policy[list].includes(ANY_HOST)
    await write(SETTING_KEYS[list], JSON.stringify(hosts))
    const isAny = hosts.includes(ANY_HOST)
    if (isAny !== wasAny) await logChange({ which: list, on: isAny, by: actorId })
  }

  const sealedKey = async (): Promise<SealedServerKey | null> => {
    const stored = json((await rows.get(SETTING_KEYS.agentKey)) ?? undefined)
    return stored ? (stored as SealedServerKey) : null
  }

  // A lone integration key — Exa's, Unsplash's — sealed under its own id, shown by its last four.
  const loneKey = (settingKey: string, sealId: string) => {
    const sealed = async (): Promise<SealedSearchKey | null> => {
      const stored = json((await rows.get(settingKey)) ?? undefined)
      return stored ? (stored as SealedSearchKey) : null
    }
    return {
      async secret() {
        const row = await sealed()
        return row ? open(masterKey, sealId, row) : null
      },
      async info() {
        const row = await sealed()
        if (!row) return null
        return {
          last4: row.last4,
          updatedAt: new Date(row.updatedAt),
          updatedBy: row.updatedBy ? await nameOf(row.updatedBy) : null,
        }
      },
      async set(actorId: string, key: string) {
        const row: SealedSearchKey = {
          ...(await seal(masterKey, sealId, key)),
          updatedBy: actorId,
          updatedAt: new Date().toISOString(),
        }
        await rows.put(settingKey, JSON.stringify(row))
        return { last4: row.last4 }
      },
      drop: () => rows.drop(settingKey),
    }
  }
  const search = loneKey(SETTING_KEYS.searchKey, SERVER_SEARCH_SEAL_ID)
  const unsplash = loneKey(SETTING_KEYS.unsplashKey, SERVER_UNSPLASH_SEAL_ID)

  return {
    async load() {
      values.clear()
      for (const row of await rows.all()) values.set(row.key, row.value)
      policy = policyOf(values)
    },
    policy: () => policy,
    setFetchHosts: (actorId, hosts) => writeHosts(actorId, 'fetchHosts', hosts),
    setEmbedHosts: (actorId, hosts) => writeHosts(actorId, 'embedHosts', hosts),
    setWidgetHosts: (actorId, hosts) => writeHosts(actorId, 'widgetHosts', hosts),
    setWidgets: (enabled) => write(SETTING_KEYS.widgets, enabled ? '1' : '0'),
    setDefaults: (defaults) => write(SETTING_KEYS.defaults, JSON.stringify(defaults)),
    setPagePackages: (packages) => write(SETTING_KEYS.pagePackages, JSON.stringify(packages)),

    async setSafeguard(actorId, which, on) {
      await write(SETTING_KEYS.safeguards, JSON.stringify({ ...policy.safeguards, [which]: on }))
      await logChange({ which, on, by: actorId })
    },
    async setLimits(actorId, limits) {
      await write(SETTING_KEYS.limits, JSON.stringify(limits))
      const tuned = (Object.keys(CODE_LIMITS) as CodeLimit[]).some(
        (key) => policy.limits[key] !== CODE_LIMITS[key],
      )
      await logChange({ which: 'limits', on: tuned, by: actorId })
    },
    async safeguardLog() {
      const latest = new Map<SafeguardChange['which'], SafeguardChange>()
      for (const change of changesOf(values.get(SETTING_KEYS.safeguardLog))) {
        latest.set(change.which, change)
      }
      return Promise.all(
        [...latest.values()].map(async (change) => ({
          which: change.which,
          on: change.on,
          by: await nameOf(change.by),
          at: new Date(change.at),
        })),
      )
    },

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

    searchKey: search.secret,
    searchKeyInfo: search.info,
    setSearchKey: search.set,
    removeSearchKey: search.drop,

    unsplashKey: unsplash.secret,
    unsplashKeyInfo: unsplash.info,
    setUnsplashKey: unsplash.set,
    removeUnsplashKey: unsplash.drop,
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
