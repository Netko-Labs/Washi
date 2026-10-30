import { afterEach, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { CODE_LIMITS, type ServerPolicy, serverPolicySchema } from '@washi/domain'
import {
  listCapabilityCalls,
  liveShareFor,
  openWorkspace,
  setAppMeta,
  type Workspace,
} from '@washi/repository'
import { checkUrl } from '@washi/tsuru'
import { ApprovalDesk } from '../agents/approvals'
import { CapabilityDesk } from '../agents/desk'
import { APPROVAL_MODE_KEY } from '../agents/lib'
import { currentFetchPolicy } from '../agents/tools'
import {
  EmbedHostError,
  playableEmbedHosts,
  reachableWidgetHosts,
  setEmbedHosts,
  setWidgetHosts,
} from '../embeds/service'
import { compilePage, compileWidget } from '../pages'
import { watchAutomations } from '../scripts/automations'
import { loadEngine } from '../scripts/engine'
import { installFormulaFunctions } from '../scripts/formulas'
import { codeLimits, lendServerPolicy } from '../server'
import { updateSheetAccess } from '../sheets/look'
import { createSheetFromSource } from '../sheets/service'
import { sharedPage } from '../sheets/share'
import { defineUserTable, runMutation, runQuery } from '../tables/service'

let ws: Workspace
let policy: ServerPolicy
beforeAll(async () => {
  await loadEngine()
})
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  policy = serverPolicySchema.parse({})
  lendServerPolicy(ws, () => policy)
})
afterEach(() => ws.close())

const lift = (safeguards: Partial<ServerPolicy['safeguards']>) => {
  policy = { ...policy, safeguards: { ...policy.safeguards, ...safeguards } }
}

describe('the approval desk switch (D118)', () => {
  const within = (promise: Promise<boolean>) =>
    Promise.race([promise, new Promise<'waiting'>((done) => setTimeout(() => done('waiting'), 10))])

  test('off: what leaves still asks', async () => {
    const desk = new ApprovalDesk(ws, () => null, new CapabilityDesk(ws, () => null))
    expect(await within(desk.approve('s1', 'fetch_url', { url: 'https://x.dev' }))).toBe('waiting')
    desk.dropSession('s1')
  })

  test('on: nothing stops at the desk, whatever the workspace says; ledgered auto by the server', async () => {
    setAppMeta(ws, APPROVAL_MODE_KEY, 'ask')
    lift({ approveAll: true })
    const desk = new ApprovalDesk(ws, () => null, new CapabilityDesk(ws, () => null))
    expect(await within(desk.approve('s1', 'fetch_url', { url: 'https://x.dev' }))).toBe(true)
    expect(await within(desk.approve('s1', 'web_search', { query: 'loro' }))).toBe(true)
    expect(await within(desk.approve('s1', 'action_run', { action: {} }))).toBe(true)
    expect(desk.list()).toHaveLength(0)
    const calls = listCapabilityCalls(ws)
    expect(calls).toHaveLength(3)
    for (const call of calls) expect(call).toMatchObject({ decision: 'auto', detail: 'server' })
  })

  test('* lets tsuru reach every public site, but Washi still asks unless the switch is on', async () => {
    policy = { ...policy, fetchHosts: ['*'] }
    const desk = new ApprovalDesk(ws, () => null, new CapabilityDesk(ws, () => null))
    expect(await within(desk.approve('s1', 'fetch_url', { url: 'https://x.dev' }))).toBe('waiting')
    desk.dropSession('s1')
    lift({ approveAll: true })
    expect(await within(desk.approve('s2', 'fetch_url', { url: 'https://x.dev' }))).toBe(true)
  })

  test('on: what tsuru refuses outright still refuses', async () => {
    lift({ approveAll: true })
    const desk = new ApprovalDesk(ws, () => null, new CapabilityDesk(ws, () => null))
    expect(await within(desk.approve('s1', 'fetch_url', { url: 'http://x.dev' }))).toBe(false)
    expect(await within(desk.approve('s1', 'fetch_url', { url: 'https://10.0.0.1' }))).toBe(false)
  })
})

describe('every site, and the private network (D118)', () => {
  test('* on the server’s list lets tsuru reach any public host', () => {
    policy = { ...policy, fetchHosts: ['*'] }
    expect(checkUrl('https://anything.dev/x', currentFetchPolicy(ws)).ok).toBe(true)
    expect(checkUrl('https://169.254.169.254/latest', currentFetchPolicy(ws)).ok).toBe(false)
  })

  test('the private switch lets a private host ask; off, it is refused', () => {
    expect(checkUrl('https://10.0.0.5/x', currentFetchPolicy(ws))).toMatchObject({
      ok: false,
      reason: 'private and loopback addresses are blocked',
    })
    lift({ privateNetwork: true })
    expect(checkUrl('https://10.0.0.5/x', currentFetchPolicy(ws))).toMatchObject({
      needsApproval: true,
    })
  })

  test('embeds and widget hosts take * and *.domain, the server’s merged with the workspace’s', () => {
    expect(setEmbedHosts(ws, ['*.Example.com', 'tally.so'])).toEqual(['*.example.com', 'tally.so'])
    policy = { ...policy, embedHosts: ['*'], widgetHosts: ['api.example.com'] }
    expect(playableEmbedHosts(ws)).toEqual(['*', '*.example.com', 'tally.so'])
    expect(setWidgetHosts(ws, ['wss://live.example.com'])).toEqual(['live.example.com'])
    expect(reachableWidgetHosts(ws)).toEqual(['api.example.com', 'live.example.com'])
    expect(() => setWidgetHosts(ws, ['*example.com'])).toThrow(EmbedHostError)
  })

  test('a shared link learns only whether * is listed, never the list', () => {
    const sheet = createSheetFromSource(ws, { title: 'P', source: '<Sheet title="P" />' })
    updateSheetAccess(ws, sheet.id, { visibility: 'public', access: [] }, 'rin')
    const token = liveShareFor(ws, sheet.id)?.token ?? ''
    policy = { ...policy, embedHosts: ['tally.so'] }
    expect(sharedPage(ws, token).embedsAnySite).toBe(false)
    policy = { ...policy, embedHosts: ['*'] }
    const page = sharedPage(ws, token)
    expect(page.embedsAnySite).toBe(true)
    expect(JSON.stringify(page)).not.toContain('tally.so')
  })

  test('a workspace with no server lent (embedded) keeps every guard', () => {
    const local = openWorkspace({ id: 'local', path: ':memory:' })
    expect(currentFetchPolicy(local).allowPrivate).toBe(false)
    expect(codeLimits(local)).toEqual(CODE_LIMITS)
    expect(reachableWidgetHosts(local)).toEqual([])
    local.close()
  })
})

describe('code limits are read through the lent policy (D118)', () => {
  const tune = (limits: Partial<ServerPolicy['limits']>) => {
    policy = { ...policy, limits: { ...policy.limits, ...limits } }
  }

  test('a page’s sandbox budget and bundle cap are the server’s', async () => {
    tune({ pageDrawMs: 250, pageMemoryMb: 64 })
    const source = 'const n = 1\n<Sheet title="t"><Text>{n}</Text></Sheet>'
    expect(await compilePage(source, () => null, null, codeLimits(ws))).toMatchObject({
      ok: true,
      sandbox: { deadlineMs: 250, memoryBytes: 64 * 1024 * 1024 },
    })
    const heavy = `import { z } from 'zod'\nconst s = z.string()\n<Sheet title="t"><Text>{s.parse('a')}</Text></Sheet>`
    tune({ pageBundleKb: 64 })
    expect(await compilePage(heavy, () => null, null, codeLimits(ws))).toMatchObject({
      ok: false,
      error: expect.stringContaining('import less'),
    })
  })

  test('a widget carries the hosts its frame may reach', async () => {
    policy = { ...policy, widgetHosts: ['*.example.com'] }
    const source =
      'function Clock() { return <div /> }\n<Sheet title="t"><Widget title="c"><Clock /></Widget></Sheet>'
    const reach = { maxKb: codeLimits(ws).widgetBundleKb, network: reachableWidgetHosts(ws) }
    expect(await compileWidget(source, 'Clock', () => null, null, reach)).toMatchObject({
      ok: true,
      network: ['*.example.com'],
    })
  })

  test('an automation runs on the server’s deadline', async () => {
    tune({ automationMs: 30 })
    defineUserTable(ws, { name: 'tasks', columns: [{ name: 'title', type: 'text' }] })
    const stop = watchAutomations(ws, () => {})
    createSheetFromSource(ws, {
      title: 'Rules',
      source:
        '<Sheet title="Rules"><Automation table="tasks" on="insert" title="r">{`function run() { while (true) {} }`}</Automation></Sheet>',
    })
    runMutation(ws, { kind: 'insert', table: 'tasks', data: { title: 'T' } }, 'p1')
    for (let i = 0; i < 40; i++) await Bun.sleep(10)
    stop()
    expect(listCapabilityCalls(ws)[0]).toMatchObject({ detail: 'ran past 30 ms' })
  })

  test('a formula function runs on the server’s time per call', () => {
    installFormulaFunctions(ws)
    createSheetFromSource(ws, {
      title: 'Functions',
      source:
        '<Sheet title="Functions"><Formula name="slow">{`function slow(x) { const end = Date.now() + 40; while (Date.now() < end) {} return x }`}</Formula></Sheet>',
    })
    defineUserTable(ws, {
      name: 'prices',
      columns: [
        { name: 'price', type: 'number' },
        { name: 'gross', type: 'formula', expr: 'slow(price)' },
      ],
    })
    runMutation(ws, { kind: 'insert', table: 'prices', data: { price: 10 } }, 'p1')
    const gross = () => runQuery(ws, { table: 'prices' }).rows[0]?.gross
    expect(gross()).toBeNull()
    tune({ formulaMs: 500 })
    expect(gross()).toBe(10)
  })
})

describe('service never reads the instance store (C3)', () => {
  test('no file under service imports the control plane', async () => {
    const glob = new Bun.Glob('**/*.ts')
    for await (const file of glob.scan({ cwd: `${import.meta.dir}/..` })) {
      if (file.startsWith('__tests__')) continue
      const code = await Bun.file(`${import.meta.dir}/../${file}`).text()
      expect(code.includes('@washi/control')).toBe(false)
    }
  })
})
