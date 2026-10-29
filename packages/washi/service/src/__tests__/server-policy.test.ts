import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { type ServerPolicy, serverPolicySchema } from '@washi/domain'
import { getAppMeta, openWorkspace, setAppMeta, type Workspace } from '@washi/repository'
import { checkUrl } from '@washi/tsuru'
import { CapabilityDesk } from '../agents/desk'
import { APPROVAL_MODE_KEY, DAILY_CAP_USD_KEY, DAILY_TURN_CAP_KEY } from '../agents/lib'
import { currentFetchPolicy, ownFetchHosts, TSURU_HOSTS_KEY } from '../agents/tools'
import {
  EmbedHostError,
  playableEmbedHosts,
  setEmbedHosts,
  setWidgetsEnabled,
  widgetsEnabled,
} from '../embeds/service'
import { applyWorkspaceDefaults, lendServerPolicy } from '../server'

let ws: Workspace
let policy: ServerPolicy
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  policy = serverPolicySchema.parse({})
  lendServerPolicy(ws, () => policy)
})
afterEach(() => ws.close())

describe('the server’s fetch allowlist (D105)', () => {
  test('merges with the workspace’s own, and what tsuru refuses still refuses', () => {
    setAppMeta(ws, TSURU_HOSTS_KEY, JSON.stringify(['docs.example.com']))
    policy = { ...policy, fetchHosts: ['api.example.com', 'docs.example.com', '*.wiki.org'] }

    const allowed = currentFetchPolicy(ws).allowedHosts
    expect(allowed.sort()).toEqual(['*.wiki.org', 'api.example.com', 'docs.example.com'])
    expect(checkUrl('https://api.example.com/v1', currentFetchPolicy(ws)).ok).toBe(true)
    expect(checkUrl('https://en.wiki.org/a', currentFetchPolicy(ws)).ok).toBe(true)
    expect(checkUrl('http://api.example.com/v1', currentFetchPolicy(ws))).toMatchObject({
      ok: false,
      reason: 'https only',
    })
    expect(checkUrl('https://other.example.com', currentFetchPolicy(ws))).toMatchObject({
      needsApproval: true,
    })
  })

  test('“Always” writes only the workspace’s own host, never the server’s list into it', () => {
    policy = { ...policy, fetchHosts: ['api.example.com'] }
    const desk = new CapabilityDesk(ws, () => null)
    desk.allowFetchHost('https://api.example.com/x')
    expect(ownFetchHosts(ws)).toEqual([])
    desk.allowFetchHost('https://news.example.com/x')
    expect(ownFetchHosts(ws)).toEqual(['news.example.com'])
  })

  test('a workspace with no server lent (embedded) has only its own', () => {
    const local = openWorkspace({ id: 'local', path: ':memory:' })
    expect(currentFetchPolicy(local).allowedHosts).toEqual([])
    expect(widgetsEnabled(local)).toBe(false)
    expect(setWidgetsEnabled(local, true)).toBe(true)
    local.close()
  })
})

describe('the server’s embeds and widgets (D105)', () => {
  test('server sites play beside the workspace’s', () => {
    setEmbedHosts(ws, ['tally.so'])
    policy = { ...policy, embedHosts: ['docs.example.com', 'tally.so'] }
    expect(playableEmbedHosts(ws)).toEqual(['docs.example.com', 'tally.so'])
  })

  test('the server’s off is off for every workspace; on, the workspace decides', () => {
    expect(setWidgetsEnabled(ws, true)).toBe(true)
    policy = { ...policy, widgets: false }
    expect(widgetsEnabled(ws)).toBe(false)
    expect(() => setWidgetsEnabled(ws, true)).toThrow(EmbedHostError)
    expect(setWidgetsEnabled(ws, false)).toBe(false)

    policy = { ...policy, widgets: true }
    expect(widgetsEnabled(ws)).toBe(false)
    expect(setWidgetsEnabled(ws, true)).toBe(true)
  })
})

describe('workspace defaults (D105)', () => {
  test('land in the workspace’s own file; an unset one keeps Washi’s', () => {
    applyWorkspaceDefaults(ws, { approvalMode: 'auto', turnCap: 40 })
    expect(getAppMeta(ws, APPROVAL_MODE_KEY)).toBe('auto')
    expect(getAppMeta(ws, DAILY_TURN_CAP_KEY)).toBe('40')
    expect(getAppMeta(ws, DAILY_CAP_USD_KEY)).toBeNull()
  })
})
