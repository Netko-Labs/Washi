import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createEmbeddedControlPlane } from '@washi/control/embedded'
import { type ServerPolicy, serverPolicySchema } from '@washi/domain'
import { openWorkspace } from '@washi/repository'
import { DEFAULT_DAILY_CAP_USD } from '@washi/service'
import { keyWithFallback } from '../keys'
import { createRuntime } from '../runtime'
import type { Runtime } from '../types'

const OWN = { apiKey: 'sk-own-not-real', provider: 'openrouter', model: 'x/y' }
const SERVER = { apiKey: 'sk-server-not-real', provider: 'anthropic', model: null }

describe('which key a hosted workspace runs on (D105)', () => {
  test('its own key wins over the server’s', async () => {
    const lookup = keyWithFallback(
      async () => OWN,
      async () => SERVER,
    )
    expect(await lookup('w1')).toEqual({ ...OWN, source: 'workspace' })
  })

  test('without one it runs on the server’s', async () => {
    const lookup = keyWithFallback(
      async () => null,
      async () => SERVER,
    )
    expect(await lookup('w1')).toEqual({ ...SERVER, source: 'server' })
  })

  test('with neither, Washi sleeps', async () => {
    const lookup = keyWithFallback(
      async () => null,
      async () => null,
    )
    expect(await lookup('w1')).toBeNull()
  })

  test('the agent host reports a lent key as the server’s', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'washi-key-'))
    const runtime = createRuntime({
      mode: 'hosted',
      control: createEmbeddedControlPlane({ workspaceId: 'w1' }),
      dataDir: dir,
      storedAgentKey: keyWithFallback(
        async () => null,
        async () => SERVER,
      ),
    })
    const status = await runtime.resolve('w1').host.inference()
    expect(status.apiKey).toEqual({ provider: 'anthropic', source: 'server' })
    runtime.close()
    rmSync(dir, { recursive: true, force: true })
  })
})

let dir = ''
let runtime: Runtime | null = null
afterEach(() => {
  runtime?.close()
  runtime = null
  if (dir) rmSync(dir, { recursive: true, force: true })
})

describe('what a new workspace starts with (D105)', () => {
  test('a new file takes the server’s defaults; an existing one keeps its own', () => {
    dir = mkdtempSync(join(tmpdir(), 'washi-defaults-'))
    openWorkspace({ id: 'old', path: join(dir, 'old.db') }).close()
    const policy: ServerPolicy = serverPolicySchema.parse({
      defaults: { approvalMode: 'auto', dailyCapUsd: 7 },
    })
    runtime = createRuntime({
      mode: 'hosted',
      control: createEmbeddedControlPlane({ workspaceId: 'new' }),
      dataDir: dir,
      serverPolicy: () => policy,
    })

    const fresh = runtime.resolve('new').host
    expect(fresh.approvalMode()).toBe('auto')
    expect(fresh.settings().capUsd).toBe(7)
    const old = runtime.resolve('old').host
    expect(old.approvalMode()).toBe('ask')
    expect(old.settings().capUsd).toBe(DEFAULT_DAILY_CAP_USD)
  })

  test('applied once: reopening after a change of defaults leaves the workspace alone', () => {
    dir = mkdtempSync(join(tmpdir(), 'washi-defaults-'))
    let policy: ServerPolicy = serverPolicySchema.parse({ defaults: { approvalMode: 'auto' } })
    const boot = () =>
      createRuntime({
        mode: 'hosted',
        control: createEmbeddedControlPlane({ workspaceId: 'w1' }),
        dataDir: dir,
        serverPolicy: () => policy,
      })
    runtime = boot()
    expect(runtime.resolve('w1').host.approvalMode()).toBe('auto')
    runtime.close()

    policy = serverPolicySchema.parse({ defaults: { approvalMode: 'ask' } })
    runtime = boot()
    expect(runtime.resolve('w1').host.approvalMode()).toBe('auto')
  })
})
