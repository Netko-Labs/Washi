import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { startServer } from '../index'
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

const query = async (path: string, input?: unknown) => {
  const suffix = input === undefined ? '' : `?input=${encodeURIComponent(JSON.stringify(input))}`
  const res = await fetch(`${server.url}/trpc/${path}${suffix}`)
  return (await res.json()) as { result?: { data: unknown }; error?: unknown }
}

const mutate = async (path: string, input: unknown) => {
  const res = await fetch(`${server.url}/trpc/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
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
    expect(id).toBeString()

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
