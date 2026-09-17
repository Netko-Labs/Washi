import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { startServer } from '../index'
import { tokenFrom } from '../lib/http'
import { assertMode } from '../lib/mode'
import type { RunningServer } from '../lib/types'

let server: RunningServer
let dataDir: string

beforeAll(() => {
  dataDir = mkdtempSync(join(tmpdir(), 'washi-test-'))
  server = startServer({ mode: 'embedded', dataDir })
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

  test('hosted refuses to boot unauthenticated without an explicit acknowledgement', () => {
    const previous = process.env.WASHI_ALLOW_UNAUTHENTICATED
    process.env.WASHI_ALLOW_UNAUTHENTICATED = undefined as unknown as string
    delete process.env.WASHI_ALLOW_UNAUTHENTICATED
    expect(() => assertMode('hosted')).toThrow(/no authentication until phase 2/)
    if (previous !== undefined) process.env.WASHI_ALLOW_UNAUTHENTICATED = previous
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
