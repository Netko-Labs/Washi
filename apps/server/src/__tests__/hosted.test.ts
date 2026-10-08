import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Actor, ControlPlane } from '@washi/trpc'
import { startServer } from '../index'
import type { RunningServer } from '../lib/types'

const ALICE: Actor = { id: 'user_alice', email: 'alice@example.com', name: 'Alice' }
const HERS = 'org_alice'
const THEIRS = 'org_someone_else'

/**
 * A stand-in for Postgres + Better Auth. What is under test is the wiring —
 * that workspaceProcedure actually asks, and that a non-member is told nothing.
 */
const control: ControlPlane = {
  async authenticate(request) {
    return request.headers.get('authorization') === 'Bearer alice-session' ? ALICE : null
  },
  async authorize(actorId, workspaceId) {
    return actorId === ALICE.id && workspaceId === HERS
  },
  async listWorkspaces(actorId) {
    return actorId === ALICE.id ? [{ id: HERS, name: 'Alice', role: 'owner' }] : []
  },
  async handle() {
    return null
  },
  async close() {},
}

let server: RunningServer
let dataDir: string

beforeAll(() => {
  dataDir = mkdtempSync(join(tmpdir(), 'washi-hosted-'))
  server = startServer({
    mode: 'hosted',
    control,
    dataDir,
    hostname: '127.0.0.1',
    port: 0,
    defaultWorkspaceId: HERS,
  })
})

afterAll(async () => {
  await server.stop()
  rmSync(dataDir, { recursive: true, force: true })
})

const call = async (path: string, init: { signedIn?: boolean; workspace?: string } = {}) => {
  const headers: Record<string, string> = {}
  if (init.signedIn) headers.authorization = 'Bearer alice-session'
  if (init.workspace) headers['x-washi-workspace'] = init.workspace
  const res = await fetch(`${server.url}/trpc/${path}`, { headers })
  return { status: res.status, body: (await res.json()) as Record<string, unknown> }
}

const errorCode = (body: Record<string, unknown>) =>
  ((body.error as { data?: { code?: string } })?.data ?? {}).code

describe('hosted mode does not use the embedded token', () => {
  test('a public procedure answers without any credential', async () => {
    const { body } = await call('system.ping')
    expect((body.result as { data: unknown }).data).toBe('pong')
  })
})

describe('a workspace is an organization you belong to', () => {
  test('signed out, content is refused', async () => {
    const { body } = await call('sheets.list', { workspace: HERS })
    expect(errorCode(body)).toBe('UNAUTHORIZED')
  })

  test('a member opens her own workspace', async () => {
    const { body } = await call('sheets.list', { signedIn: true, workspace: HERS })
    expect(body.result).toBeDefined()
    expect((body.result as { data: unknown[] }).data).toEqual([])
  })

  test('a non-member gets NOT_FOUND, not FORBIDDEN — she learns nothing about it', async () => {
    const { body } = await call('sheets.list', { signedIn: true, workspace: THEIRS })
    expect(errorCode(body)).toBe('NOT_FOUND')
  })

  test('listing workspaces shows only her own', async () => {
    const { body } = await call('workspaces.list', { signedIn: true })
    expect((body.result as { data: { id: string }[] }).data.map((w) => w.id)).toEqual([HERS])
  })

  test('signed out, she is a member of nothing', async () => {
    const { body } = await call('workspaces.list')
    expect((body.result as { data: unknown[] }).data).toEqual([])
  })

  test('a deployment with no key store says so instead of pretending', async () => {
    const res = await fetch(`${server.url}/trpc/workspaces.setAgentKey`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer alice-session',
        'x-washi-workspace': HERS,
      },
      body: JSON.stringify({ key: 'sk-ant-whatever' }),
    })
    expect(errorCode((await res.json()) as Record<string, unknown>)).toBe('PRECONDITION_FAILED')
  })
})

/**
 * One event bus serves every workspace on the server. Before these were
 * workspaceProcedures, anyone who could reach the server — signed in or not —
 * could stream every workspace's transcript and approval requests.
 */
describe("a transcript stream is the workspace's content", () => {
  const subscribe = async (init: { signedIn?: boolean; workspace?: string }) => {
    const params = init.workspace
      ? `&connectionParams=${encodeURIComponent(JSON.stringify({ workspace: init.workspace }))}`
      : ''
    const abort = new AbortController()
    const res = await fetch(`${server.url}/trpc/agents.onAgentUpdate?input=%7B%7D${params}`, {
      headers: {
        accept: 'text/event-stream',
        ...(init.signedIn ? { authorization: 'Bearer alice-session' } : {}),
      },
      signal: abort.signal,
    })
    const reader = res.body?.getReader()
    let text = ''
    const deadline = Date.now() + 1_000
    while (reader && Date.now() < deadline && !/UNAUTHORIZED|NOT_FOUND|connected/.test(text)) {
      const chunk = await Promise.race([reader.read(), Bun.sleep(200).then(() => null)])
      if (chunk?.value) text += new TextDecoder().decode(chunk.value)
      if (chunk?.done) break
    }
    abort.abort()
    return text
  }

  test('signed out, the stream is refused', async () => {
    expect(await subscribe({ workspace: HERS })).toContain('UNAUTHORIZED')
  })

  test("a member cannot stream someone else's workspace", async () => {
    expect(await subscribe({ signedIn: true, workspace: THEIRS })).toContain('NOT_FOUND')
  })

  test('a member streams her own, named in connectionParams', async () => {
    const text = await subscribe({ signedIn: true, workspace: HERS })
    expect(text).not.toContain('UNAUTHORIZED')
    expect(text).not.toContain('NOT_FOUND')
  })
})
