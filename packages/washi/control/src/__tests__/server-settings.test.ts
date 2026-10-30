import { describe, expect, test } from 'bun:test'
import { CODE_LIMITS, SAFEGUARDS_ON } from '@washi/domain'
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

describe('the server’s own search key', () => {
  test('is sealed apart from the model key; info never carries it', async () => {
    const { rows, store } = memoryRows()
    const settings = settingsOver(store)
    const exa = 'exa-server-not-real-7c3e'
    await settings.setKey('u1', { key: KEY, provider: 'anthropic' })
    expect(await settings.setSearchKey('u1', exa)).toEqual({ last4: '7c3e' })
    expect(rows.get(SETTING_KEYS.searchKey)).not.toContain('exa-server')

    const info = await settings.searchKeyInfo()
    expect(info).toMatchObject({ last4: '7c3e', updatedBy: 'First' })
    expect(JSON.stringify(info)).not.toContain('exa-server')
    expect(await settings.searchKey()).toBe(exa)
    expect((await settings.agentKey())?.apiKey).toBe(KEY)

    await settings.removeSearchKey()
    expect(await settings.searchKey()).toBeNull()
    expect(await settings.searchKeyInfo()).toBeNull()
    expect((await settings.agentKey())?.apiKey).toBe(KEY)
  })
})

describe('the server’s own Unsplash key (D117)', () => {
  test('is sealed under its own id, beside the search key and never over it', async () => {
    const { rows, store } = memoryRows()
    const settings = settingsOver(store)
    await settings.setSearchKey('u1', 'exa-server-not-real-7c3e')
    expect(await settings.setUnsplashKey('u1', 'unsplash-access-not-real-9f2a')).toEqual({
      last4: '9f2a',
    })
    expect(rows.get(SETTING_KEYS.unsplashKey)).not.toContain('unsplash-access')
    expect(await settings.unsplashKeyInfo()).toMatchObject({ last4: '9f2a', updatedBy: 'First' })
    expect(await settings.unsplashKey()).toBe('unsplash-access-not-real-9f2a')
    expect(await settings.searchKey()).toBe('exa-server-not-real-7c3e')

    await settings.removeUnsplashKey()
    expect(await settings.unsplashKey()).toBeNull()
    expect(await settings.searchKey()).toBe('exa-server-not-real-7c3e')
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
      widgetHosts: [],
      widgets: true,
      defaults: {},
      pagePackages: [],
      safeguards: SAFEGUARDS_ON,
      limits: CODE_LIMITS,
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

  test('one bad row falls back alone; a widgets switch that cannot be read is off', async () => {
    const { store } = memoryRows({
      [SETTING_KEYS.fetchHosts]: '["api.example.com"]',
      [SETTING_KEYS.embedHosts]: 'not json',
      [SETTING_KEYS.widgets]: 'garbled',
    })
    const settings = settingsOver(store)
    await settings.load()
    expect(settings.policy()).toMatchObject({
      fetchHosts: ['api.example.com'],
      embedHosts: [],
      widgets: false,
    })
  })

  test('the page packages (D116) load at boot, and one bad entry drops the row, never the rest', async () => {
    const nanoid = { name: 'nanoid', spec: '^5', version: '5.1.6' }
    const { store } = memoryRows({
      [SETTING_KEYS.pagePackages]: JSON.stringify([nanoid]),
      [SETTING_KEYS.fetchHosts]: '["api.example.com"]',
    })
    const settings = settingsOver(store)
    await settings.load()
    expect(settings.policy().pagePackages).toEqual([nanoid])

    await settings.setPagePackages([{ name: 'ms', spec: 'latest', version: null }])
    expect(settings.policy().pagePackages).toEqual([{ name: 'ms', spec: 'latest', version: null }])

    const garbled = memoryRows({ [SETTING_KEYS.pagePackages]: '[{"name":""}]' })
    const fallen = settingsOver(garbled.store)
    await fallen.load()
    expect(fallen.policy()).toMatchObject({ pagePackages: [], widgets: true })
  })
})

describe('the safeguards (D118)', () => {
  test('a fresh server holds every one, at today’s limits', async () => {
    const settings = settingsOver(memoryRows().store)
    await settings.load()
    expect(settings.policy()).toMatchObject({ safeguards: SAFEGUARDS_ON, limits: CODE_LIMITS })
  })

  test('each switch reads alone; anything but a literal true keeps the guard', async () => {
    const { store } = memoryRows({
      [SETTING_KEYS.safeguards]: '{"privateNetwork":"yes","approveAll":true,"other":true}',
    })
    const settings = settingsOver(store)
    await settings.load()
    expect(settings.policy().safeguards).toEqual({ privateNetwork: false, approveAll: true })
  })

  test('a row that is not json keeps every guard', async () => {
    const { store } = memoryRows({
      [SETTING_KEYS.safeguards]: 'garbled',
      [SETTING_KEYS.limits]: 'garbled',
    })
    const settings = settingsOver(store)
    await settings.load()
    expect(settings.policy()).toMatchObject({ safeguards: SAFEGUARDS_ON, limits: CODE_LIMITS })
  })

  test('a limit out of range falls back to today’s alone', async () => {
    const { store } = memoryRows({
      [SETTING_KEYS.limits]: '{"pageDrawMs":99999,"formulaMs":50,"imageMb":"big"}',
    })
    const settings = settingsOver(store)
    await settings.load()
    expect(settings.policy().limits).toEqual({ ...CODE_LIMITS, formulaMs: 50 })
  })

  test('every flip is logged; the newest per switch reads back by name', async () => {
    const { rows, store } = memoryRows()
    const settings = settingsOver(store)
    await settings.load()
    await settings.setSafeguard('u1', 'privateNetwork', true)
    await settings.setSafeguard('u1', 'privateNetwork', false)
    await settings.setSafeguard('u1', 'approveAll', true)
    await settings.setLimits('u1', { ...CODE_LIMITS, pageDrawMs: 300 })
    expect(settings.policy().safeguards).toEqual({ privateNetwork: false, approveAll: true })
    expect(settings.policy().limits.pageDrawMs).toBe(300)

    const log = JSON.parse(rows.get(SETTING_KEYS.safeguardLog) ?? '[]')
    expect(log).toHaveLength(4)
    expect(log[0]).toMatchObject({ which: 'privateNetwork', on: true, by: 'u1' })
    const latest = await settings.safeguardLog()
    expect(latest).toMatchObject([
      { which: 'privateNetwork', on: false, by: 'First' },
      { which: 'approveAll', on: true, by: 'First' },
      { which: 'limits', on: true, by: 'First' },
    ])
  })

  test('a host list gaining or losing * is logged; other edits are not', async () => {
    const { rows, store } = memoryRows()
    const settings = settingsOver(store)
    await settings.load()
    await settings.setEmbedHosts('u1', ['tally.so'])
    expect(rows.get(SETTING_KEYS.safeguardLog)).toBeUndefined()
    await settings.setWidgetHosts('u1', ['*'])
    await settings.setFetchHosts('u1', ['*', 'api.example.com'])
    await settings.setFetchHosts('u1', ['api.example.com'])
    expect(settings.policy()).toMatchObject({ widgetHosts: ['*'], fetchHosts: ['api.example.com'] })
    expect(await settings.safeguardLog()).toMatchObject([
      { which: 'widgetHosts', on: true },
      { which: 'fetchHosts', on: false },
    ])
  })
})
