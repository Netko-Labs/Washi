import { describe, expect, test } from 'bun:test'
import { SETTING_KEYS } from '../lib/constants'
import { createServerSettings } from '../lib/server-settings'
import type { SettingRows } from '../lib/types'

const MASTER = 'm'.repeat(48)
const KEY = 'sk-ant-api03-server-not-real-4b1d'

function memoryRows(seed: Record<string, string> = {}) {
  const rows = new Map(Object.entries(seed))
  const store: SettingRows = {
    all: async () => [...rows].map(([key, value]) => ({ key, value })),
    get: async (key) => rows.get(key) ?? null,
    put: async (key, value) => {
      rows.set(key, value)
    },
    drop: async (key) => {
      rows.delete(key)
    },
  }
  return { rows, store }
}

const settingsOver = (store: SettingRows) =>
  createServerSettings({ rows: store, masterKey: MASTER, nameOf: async () => 'First' })

describe('the server’s own key (D105)', () => {
  test('is sealed: only the last four are legible, the agent host gets it back', async () => {
    const { rows, store } = memoryRows()
    const settings = settingsOver(store)
    expect(await settings.setKey('u1', { key: KEY, provider: 'anthropic' })).toEqual({
      last4: '4b1d',
    })
    expect(rows.get(SETTING_KEYS.agentKey)).not.toContain('sk-ant')
    expect(await settings.keyInfo()).toMatchObject({ last4: '4b1d', updatedBy: 'First' })
    expect(await settings.agentKey()).toEqual({ apiKey: KEY, provider: 'anthropic', model: null })

    await settings.setKeyModel('u1', 'claude-opus-5-5')
    expect((await settings.agentKey())?.model).toBe('claude-opus-5-5')
    await settings.removeKey()
    expect(await settings.agentKey()).toBeNull()
  })
})

describe('the server policy (D105)', () => {
  test('reads from memory once loaded, and every write updates it', async () => {
    const { store } = memoryRows({ [SETTING_KEYS.fetchHosts]: '["api.example.com"]' })
    const settings = settingsOver(store)
    expect(settings.policy().fetchHosts).toEqual([])
    await settings.load()
    expect(settings.policy()).toEqual({
      fetchHosts: ['api.example.com'],
      embedHosts: [],
      widgets: true,
      defaults: {},
    })
    await settings.setWidgets(false)
    await settings.setDefaults({ turnCap: 40 })
    expect(settings.policy()).toMatchObject({ widgets: false, defaults: { turnCap: 40 } })
  })

  test('a row that no longer parses reads as unset', async () => {
    const { store } = memoryRows({
      [SETTING_KEYS.embedHosts]: 'not json',
      [SETTING_KEYS.defaults]: '{"turnCap":-3}',
    })
    const settings = settingsOver(store)
    await settings.load()
    expect(settings.policy()).toMatchObject({ embedHosts: [], defaults: {} })
  })
})
