import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
  openWorkspace,
  recordSpend,
  setAppMeta,
  spendForDay,
  type Workspace,
} from '@washi/repository'
import { AgentHost } from '../agents/host'
import {
  createEmbeddedKeySource,
  createStoredKeySource,
  INFERENCE_PREFERENCE_KEY,
  LOCAL_MODEL_KEY,
  parseAuthStatus,
  parseVersion,
  probeLocalCli,
} from '../agents/inference'
import { DAILY_CAP_USD_KEY, type LocalCliStatus } from '../agents/lib'
import { normalizeMessage } from '../agents/normalize'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
})
afterEach(() => ws.close())

const signedIn: LocalCliStatus = {
  executable: '/Users/x/.local/bin/claude',
  version: '2.1.293',
  loggedIn: true,
  authMethod: 'claude.ai',
  plan: 'max',
}
const probing = (status: LocalCliStatus | null) => async () => status

describe('finding the local claude', () => {
  test('the first executable candidate wins, and both probes read from it', async () => {
    const ran: string[][] = []
    const status = await probeLocalCli({
      candidates: () => ['/nope/claude', '/yes/claude', '/also/claude'],
      isExecutable: (path) => path !== '/nope/claude',
      run: async (argv) => {
        ran.push(argv)
        return argv[1] === '--version'
          ? '2.1.293 (Claude Code)\n'
          : JSON.stringify({ loggedIn: true, authMethod: 'claude.ai', subscriptionType: 'pro' })
      },
    })
    expect(status).toEqual({
      executable: '/yes/claude',
      version: '2.1.293',
      loggedIn: true,
      authMethod: 'claude.ai',
      plan: 'pro',
    })
    expect(ran.every((argv) => argv[0] === '/yes/claude')).toBe(true)
  })

  test('no install is null, not a throw', async () => {
    const status = await probeLocalCli({
      candidates: () => ['/a', '/b'],
      isExecutable: () => false,
      run: async () => null,
    })
    expect(status).toBeNull()
  })

  test('the account email in `auth status` is read past, never kept', () => {
    const parsed = parseAuthStatus(
      JSON.stringify({ loggedIn: true, email: 'someone@example.com', subscriptionType: 'max' }),
    )
    expect(JSON.stringify(parsed)).not.toContain('someone@example.com')
  })

  test('garbage from the CLI reads as signed out', () => {
    expect(parseAuthStatus('not json').loggedIn).toBe(false)
    expect(parseAuthStatus(null).loggedIn).toBe(false)
    expect(parseVersion('Claude Code, version unknown')).toBeNull()
  })
})

describe('embedded: who pays for the next turn', () => {
  test('auto prefers the signed-in local CLI over an env key', async () => {
    const source = createEmbeddedKeySource(ws, probing(signedIn), { ANTHROPIC_API_KEY: 'sk-ant-x' })
    expect(await source.resolve()).toMatchObject({
      kind: 'local_cli',
      executable: signedIn.executable,
    })
  })

  test('a claude.ai login is a plan; a Console login is a key in disguise', async () => {
    const plan = createEmbeddedKeySource(ws, probing(signedIn), {})
    expect(await plan.resolve()).toMatchObject({ kind: 'local_cli', plan: true })
    const consoleLogin = createEmbeddedKeySource(
      ws,
      probing({ ...signedIn, authMethod: 'console', plan: null }),
      {},
    )
    expect(await consoleLogin.resolve()).toMatchObject({ kind: 'local_cli', plan: false })
  })

  test('auto falls back to the env key when the CLI is signed out', async () => {
    const source = createEmbeddedKeySource(ws, probing({ ...signedIn, loggedIn: false }), {
      ANTHROPIC_API_KEY: 'sk-ant-x',
    })
    expect(await source.resolve()).toMatchObject({ kind: 'api_key', apiKey: 'sk-ant-x' })
  })

  test('api_key ignores a signed-in CLI', async () => {
    setAppMeta(ws, INFERENCE_PREFERENCE_KEY, 'api_key')
    const source = createEmbeddedKeySource(ws, probing(signedIn), { ANTHROPIC_API_KEY: 'sk-ant-x' })
    expect((await source.resolve())?.kind).toBe('api_key')
  })

  test('local_cli never quietly bills the env key instead', async () => {
    setAppMeta(ws, INFERENCE_PREFERENCE_KEY, 'local_cli')
    const source = createEmbeddedKeySource(ws, probing(null), { ANTHROPIC_API_KEY: 'sk-ant-x' })
    expect(await source.resolve()).toBeNull()
    expect((await source.status()).missing).toContain('not installed')
  })

  test('a signed-out CLI says how to sign in', async () => {
    const source = createEmbeddedKeySource(ws, probing({ ...signedIn, loggedIn: false }), {})
    const status = await source.status()
    expect(status.active).toBeNull()
    expect(status.missing).toContain('signed out')
  })

  test('the preference persists in the workspace and a junk value reads as auto', async () => {
    const source = createEmbeddedKeySource(ws, probing(signedIn), {})
    expect((await source.setPreference?.('api_key'))?.preference).toBe('api_key')
    setAppMeta(ws, INFERENCE_PREFERENCE_KEY, 'rm -rf')
    expect((await source.status()).preference).toBe('auto')
  })

  test('a chosen model rides the local credential; default leaves it to the CLI', async () => {
    const source = createEmbeddedKeySource(ws, probing(signedIn), {})
    expect((await source.resolve())?.model).toBeUndefined()
    expect((await source.setLocalModel?.('sonnet'))?.localModel).toBe('sonnet')
    expect(await source.resolve()).toMatchObject({ kind: 'local_cli', model: 'sonnet' })
    setAppMeta(ws, LOCAL_MODEL_KEY, 'gpt-9000')
    expect((await source.status()).localModel).toBe('default')
  })

  test('status never carries a key', async () => {
    const source = createEmbeddedKeySource(ws, probing(null), {
      ANTHROPIC_API_KEY: 'sk-ant-secret',
    })
    expect(JSON.stringify(await source.status())).not.toContain('sk-ant-secret')
  })
})

describe('hosted: the workspace key and nothing else', () => {
  test('a stored key resolves as an api_key credential', async () => {
    const source = createStoredKeySource(async () => ({
      apiKey: 'sk-or-x',
      provider: 'openrouter',
      model: 'anthropic/claude-sonnet-5',
    }))
    expect(await source.resolve()).toEqual({
      kind: 'api_key',
      apiKey: 'sk-or-x',
      provider: 'openrouter',
      model: 'anthropic/claude-sonnet-5',
    })
  })

  test('no stored key is null, with no local CLI to fall back to and no way to pick one', async () => {
    const source = createStoredKeySource(async () => null)
    expect(await source.resolve()).toBeNull()
    const status = await source.status()
    expect(status.localCli).toBeNull()
    expect(status.missing).toContain('settings')
    expect(source.setPreference).toBeUndefined()
  })

  test('the host refuses a preference change on a hosted workspace', async () => {
    const host = new AgentHost(
      ws,
      createStoredKeySource(async () => null),
    )
    await expect(host.setInference('local_cli')).rejects.toThrow('own key')
  })
})

describe('a plan-covered turn is not a dollar spent', () => {
  test('plan turns land in savedUsd and still count as turns', () => {
    recordSpend(ws, 0.4, { billing: 'plan' })
    recordSpend(ws, 0.1)
    expect(spendForDay(ws)).toMatchObject({ savedUsd: 0.4, costUsd: 0.1, turns: 2 })
  })

  test('the upsert adds in the database and returns the row it left', () => {
    recordSpend(ws, 0.25)
    const total = recordSpend(ws, null, { billing: 'plan' })
    expect(total).toEqual(spendForDay(ws))
    expect(total).toMatchObject({ costUsd: 0.25, savedUsd: 0, turns: 2 })
  })

  test('the dollar cap never trips on plan turns', () => {
    setAppMeta(ws, DAILY_CAP_USD_KEY, '1')
    for (let i = 0; i < 5; i += 1) recordSpend(ws, 3, { billing: 'plan' })
    const host = new AgentHost(
      ws,
      createStoredKeySource(async () => null),
    )
    expect(host.breaker().kind).toBe('open')
    expect(host.spend().savedUsd).toBe(15)
  })

  test('the daily stop is settable and must be above zero', () => {
    const host = new AgentHost(
      ws,
      createStoredKeySource(async () => null),
    )
    expect(host.setDailyCap(40).capUsd).toBe(40)
    expect(() => host.setDailyCap(0)).toThrow('above $0')
  })

  test('activity reads idle on a quiet workspace and paused once stopped', () => {
    const host = new AgentHost(
      ws,
      createStoredKeySource(async () => null),
    )
    expect(host.activity().state).toBe('idle')
    setAppMeta(ws, DAILY_CAP_USD_KEY, '1')
    recordSpend(ws, 2)
    expect(host.activity().state).toBe('paused')
  })
})

describe('a failed turn says why', () => {
  test('a signed-out CLI ends in success with is_error, and that is an error', () => {
    const [update] = normalizeMessage({
      type: 'result',
      subtype: 'success',
      is_error: true,
      result: 'Invalid API key · Please run /login',
      total_cost_usd: 0,
    } as unknown as Parameters<typeof normalizeMessage>[0])
    expect(update).toMatchObject({ kind: 'turn_done', stopReason: 'error' })
    expect(update?.kind === 'turn_done' && update.error).toContain('/login')
  })
})
