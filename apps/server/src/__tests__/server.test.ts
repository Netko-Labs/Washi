import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createEmbeddedControlPlane } from '@washi/control/embedded'
import { startServer } from '../index'
import { DEFAULT_WORKSPACE_ID } from '../lib/constants'
import { tokenFrom } from '../lib/http'
import { assertHostedSecrets, assertMode } from '../lib/mode'
import type { RunningServer } from '../lib/types'

let server: RunningServer
let dataDir: string

beforeAll(() => {
  dataDir = mkdtempSync(join(tmpdir(), 'washi-test-'))
  server = startServer({
    mode: 'embedded',
    dataDir,
    control: createEmbeddedControlPlane({ workspaceId: DEFAULT_WORKSPACE_ID }),
  })
})

afterAll(async () => {
  await server.stop()
  rmSync(dataDir, { recursive: true, force: true })
})

const auth = () => ({ authorization: `Bearer ${server.token}` })

const query = async (path: string, input?: unknown) => {
  const suffix = input === undefined ? '' : `?input=${encodeURIComponent(JSON.stringify(input))}`
  const res = await fetch(`${server.url}/trpc/${path}${suffix}`, { headers: auth() })
  return (await res.json()) as { result?: { data: unknown }; error?: unknown }
}

const mutate = async (path: string, input: unknown) => {
  const res = await fetch(`${server.url}/trpc/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...auth() },
    body: JSON.stringify(input),
  })
  return (await res.json()) as { result?: { data: unknown }; error?: unknown }
}

describe('mode is asserted at boot, not per request', () => {
  test('embedded is the default', () => {
    expect(assertMode(undefined)).toBe('embedded')
  })

  test('an unknown mode refuses to boot', () => {
    expect(() => assertMode('staging')).toThrow(/must be "hosted" or "embedded"/)
  })

  test('hosted is a valid mode now that it has auth', () => {
    expect(assertMode('hosted')).toBe('hosted')
  })
})

describe('hosted refuses to boot without its secrets', () => {
  test('a missing database url is fatal', () => {
    expect(() => assertHostedSecrets({ WASHI_SECRET_KEY: 'x'.repeat(32) })).toThrow(
      /WASHI_DATABASE_URL/,
    )
  })

  test('a missing master key is fatal', () => {
    expect(() => assertHostedSecrets({ WASHI_DATABASE_URL: 'postgres://x' })).toThrow(
      /WASHI_SECRET_KEY/,
    )
  })

  test('a short master key is fatal, because every stored API key derives from it', () => {
    expect(() =>
      assertHostedSecrets({ WASHI_DATABASE_URL: 'postgres://x', WASHI_SECRET_KEY: 'short' }),
    ).toThrow(/at least 32 characters/)
  })

  test('both present is accepted', () => {
    const secrets = assertHostedSecrets({
      WASHI_DATABASE_URL: 'postgres://x',
      WASHI_SECRET_KEY: 'k'.repeat(32),
    })
    expect(secrets.databaseUrl).toBe('postgres://x')
  })
})

describe('the server serves the whole surface over http', () => {
  test('health reports the mode', async () => {
    const health = (await fetch(`${server.url}/health`).then((r) => r.json())) as {
      ok: boolean
      mode: string
    }
    expect(health).toEqual({ ok: true, mode: 'embedded' })
  })

  test('ping round-trips through trpc', async () => {
    expect((await query('system.ping')).result?.data).toBe('pong')
  })

  test('a sheet survives create → list → search', async () => {
    const created = (await mutate('sheets.create', {
      write: {
        title: 'Roadmap',
        source: '<Sheet title="Roadmap"><P>goblin objectives</P></Sheet>',
      },
    })) as { result?: { data: { id: string } } }
    const id = created.result?.data.id
    if (!id) throw new Error(`create returned no id: ${JSON.stringify(created)}`)

    const list = (await query('sheets.list')).result?.data as { id: string }[]
    expect(list.map((sheet) => sheet.id)).toContain(id)

    const hits = (await query('sheets.search', { term: 'goblin' })).result?.data as { id: string }[]
    expect(hits[0]?.id).toBe(id)
  })

  test('an unknown route is a 404, not a crash', async () => {
    const res = await fetch(`${server.url}/nope`)
    expect(res.status).toBe(404)
  })
})

describe('loopback is not the same thing as trusted', () => {
  test('a call without the token is refused', async () => {
    const res = await fetch(`${server.url}/trpc/system.ping`)
    expect(res.status).toBe(401)
  })

  test('a call with the wrong token is refused', async () => {
    const res = await fetch(`${server.url}/trpc/system.ping`, {
      headers: { authorization: 'Bearer not-the-token' },
    })
    expect(res.status).toBe(401)
  })

  test('connectionParams get past auth, since EventSource cannot send a header', async () => {
    const params = encodeURIComponent(JSON.stringify({ data: { token: server.token } }))
    const res = await fetch(`${server.url}/trpc/system.ping?connectionParams=${params}`)
    // trpc itself rejects connectionParams on a query; what matters here is that
    // the token was read and the request was not refused at the door.
    expect(res.status).not.toBe(401)
  })

  test('tokenFrom reads both shapes the client can send', () => {
    const url = new URL('http://x/trpc/a')
    expect(
      tokenFrom(new Request('http://x', { headers: { authorization: 'Bearer abc' } }), url),
    ).toBe('abc')

    const nested = new URL(
      `http://x/trpc/a?connectionParams=${encodeURIComponent(JSON.stringify({ data: { token: 'abc' } }))}`,
    )
    expect(tokenFrom(new Request('http://x'), nested)).toBe('abc')

    const flat = new URL(
      `http://x/trpc/a?connectionParams=${encodeURIComponent(JSON.stringify({ token: 'abc' }))}`,
    )
    expect(tokenFrom(new Request('http://x'), flat)).toBe('abc')

    expect(tokenFrom(new Request('http://x'), url)).toBeNull()
  })

  test('an origin that is neither loopback nor the app scheme is refused', async () => {
    const res = await fetch(`${server.url}/health`, { headers: { origin: 'https://evil.example' } })
    expect(res.status).toBe(403)
  })

  test('the renderer origin is reflected so the browser permits the response', async () => {
    const res = await fetch(`${server.url}/health`, {
      headers: { origin: 'http://127.0.0.1:5173' },
    })
    expect(res.headers.get('access-control-allow-origin')).toBe('http://127.0.0.1:5173')
  })

  test('preflight answers without a token, because it cannot carry one', async () => {
    const res = await fetch(`${server.url}/trpc/system.ping`, {
      method: 'OPTIONS',
      headers: { origin: 'http://127.0.0.1:5173' },
    })
    expect(res.status).toBe(204)
    expect(res.headers.get('access-control-allow-headers')).toContain('authorization')
  })
})
