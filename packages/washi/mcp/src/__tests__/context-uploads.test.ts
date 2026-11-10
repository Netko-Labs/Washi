import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import {
  createFileStore,
  type FileStore,
  listCapabilityCalls,
  localBlobStore,
  openWorkspace,
  type Workspace,
} from '@washi/repository'
import { createSheetFromSource, defineUserTable, runMutation, setAgentGuide } from '@washi/service'
import { setAddressLookup } from '@washi/tsuru'
import { answerMcp } from '../server'
import type { McpSession, McpWorkspaces } from '../types'
import { answerUpload } from '../uploads'
import { issueTicket, takeTicket } from '../uploads/tickets'

const MEMBER = { id: 'u-juan', name: 'Juan' }
const VIEWER = { id: MEMBER.id, isOwner: false }

let ws: Workspace
let other: Workspace
let files: FileStore
let client: Client

const sessionOf = (at: Workspace, name: string, isSteward = true): McpSession => ({
  ws: at,
  name,
  viewer: VIEWER,
  member: MEMBER,
  isSteward,
  listPeople: async () => [MEMBER],
  changed: () => {},
  files: at === ws ? files : undefined,
  baseUrl: 'https://washi.test',
  uploads: { url: (token) => `https://washi.test/api/uploads/${token}` },
})

const TWO: McpWorkspaces = {
  list: [
    { id: 'dashi', name: 'DashiOS' },
    { id: 'lab', name: 'Lab' },
  ],
  open: async (id) =>
    id === 'dashi' ? sessionOf(ws, 'DashiOS') : id === 'lab' ? sessionOf(other, 'Lab') : null,
}

async function connect(workspaces?: McpWorkspaces, isSteward = true) {
  const session = sessionOf(ws, 'DashiOS', isSteward)
  const fetch = (input: string | URL | Request, init?: RequestInit) =>
    answerMcp(
      input instanceof Request ? new Request(input, init) : new Request(String(input), init),
      session,
      workspaces,
    )
  client = new Client({ name: 'test-agent', version: '1.0.0' })
  await client.connect(
    new StreamableHTTPClientTransport(new URL('http://washi.test/mcp'), { fetch }),
  )
}

const text = async (name: string, args: Record<string, unknown> = {}) => {
  const result = await client.callTool({ name, arguments: args })
  const [first] = result.content as { text: string }[]
  return { isError: Boolean(result.isError), text: first?.text ?? '' }
}
const ok = async (name: string, args: Record<string, unknown> = {}) => {
  const result = await text(name, args)
  if (result.isError) throw new Error(`${name}: ${result.text}`)
  return JSON.parse(result.text)
}

const page = (at: Workspace, title: string, body: string) =>
  createSheetFromSource(at, { title, source: `<Sheet title="${title}">${body}</Sheet>` }, null).id

beforeEach(() => {
  ws = openWorkspace({ id: 'dashi', path: ':memory:' })
  other = openWorkspace({ id: 'lab', path: ':memory:' })
  files = createFileStore(ws, localBlobStore(mkdtempSync(join(tmpdir(), 'washi-mcp-up-'))))
  defineUserTable(ws, {
    name: 'backlog',
    columns: [
      { name: 'title', type: 'text' },
      {
        name: 'status',
        type: 'status',
        groups: { todo: ['Todo'], doing: ['Doing'], done: ['Done'] },
      },
    ],
  })
  runMutation(
    ws,
    {
      kind: 'insert',
      table: 'backlog',
      data: [
        { title: 'Merge to main', status: 'Todo' },
        { title: 'Shipped thing', status: 'Done' },
      ],
    },
    MEMBER.id,
  )
})

afterEach(async () => {
  await client?.close()
  ws.close()
  other.close()
})

describe('context_get and the agent guide (D135)', () => {
  test('one call reads the workspace as Markdown, the guide first', async () => {
    page(ws, 'Roadmap', '<Text>Ship 0.7, then the demo.</Text>')
    const guide = page(ws, 'Agent playbook', '<List><Item>Run every check.</Item></List>')
    await connect()
    expect(await ok('guide_set', { id: guide })).toEqual({
      guide: { id: guide, title: 'Agent playbook' },
    })
    const digest = await text('context_get')
    expect(digest.isError).toBe(false)
    // Markdown as it reads, not a JSON string of it.
    expect(digest.text).toStartWith('# DashiOS — workspace context\n')
    expect(digest.text).toContain('## Agent playbook (agent guide — read it first)')
    expect(digest.text).toContain('Ship 0.7, then the demo.')
    // A table this small is listed whole.
    expect(digest.text).toContain('All 2 rows')
    expect(digest.text).toContain('- Merge to main · Todo')
    const short = await text('context_get', { maxChars: 2000 })
    expect(short.text.length).toBeLessThanOrEqual(2000)
  })

  test('the guide is in the instructions an agent gets on connecting, and workspace_list names it', async () => {
    const guide = page(ws, 'Agent playbook', '<Text>Never force-push.</Text>')
    setAgentGuide(ws, guide, VIEWER, true)
    const labGuide = page(other, 'Lab rules', '<Text>Be kind.</Text>')
    setAgentGuide(other, labGuide, VIEWER, true)
    await connect(TWO)
    const instructions = client.getInstructions() ?? ''
    expect(instructions).toContain('DashiOS keeps an agent guide, "Agent playbook"')
    expect(instructions).toContain('Never force-push.')
    expect(instructions).toContain('Other workspaces with an agent guide: Lab ("Lab rules")')
    const listed = await ok('workspace_list')
    expect(listed).toEqual([
      {
        id: 'dashi',
        name: 'DashiOS',
        isDefault: true,
        guide: { id: guide, title: 'Agent playbook' },
      },
      { id: 'lab', name: 'Lab', isDefault: false, guide: { id: labGuide, title: 'Lab rules' } },
    ])
    expect(await ok('guide_set', { id: null })).toEqual({ guide: null })
  })

  test('only an owner or an admin sets the guide over MCP', async () => {
    const guide = page(ws, 'Agent playbook', '<Text>Never force-push.</Text>')
    await connect(undefined, false)
    const refused = await text('guide_set', { id: guide })
    expect(refused.isError).toBe(true)
    expect(refused.text).toContain('owner or an admin')
    const cleared = await text('guide_set', { id: null })
    expect(cleared.isError).toBe(true)
  })

  test('a page the member cannot read is never their guide', async () => {
    const closed = createSheetFromSource(
      ws,
      {
        title: 'Closed',
        source:
          '<Sheet title="Closed" visibility="private" access={["u-rin"]}><Text>x</Text></Sheet>',
      },
      null,
    ).id
    await connect()
    const refused = await text('guide_set', { id: closed })
    expect(refused.isError).toBe(true)
    setAgentGuide(ws, closed, { id: 'u-rin', isOwner: false }, true)
    await client.close()
    await connect()
    expect(client.getInstructions()).not.toContain('agent guide, "Closed"')
  })
})

describe('uploads that skip the context (D135)', () => {
  const Png = new Uint8Array(5 * 1024 * 1024).fill(7)

  const put = (url: string, body: Uint8Array) =>
    answerUpload(
      new Request(url, {
        method: 'PUT',
        body,
        headers: { 'content-length': String(body.byteLength) },
      }),
      url.split('/').pop() ?? '',
      ({ workspaceId, actorId }) =>
        workspaceId === ws.id && actorId === MEMBER.id ? { ws, files } : null,
    )

  test('one tool call, then one PUT of 5 MB: the key it promised is the file', async () => {
    await connect()
    const ticket = await ok('file_upload_url', { filename: 'shot.png', bytes: Png.byteLength })
    expect(ticket).toMatchObject({ method: 'PUT' })
    expect(ticket.url).toStartWith('https://washi.test/api/uploads/')
    expect(ticket.curl).toBe(`curl --fail-with-body -T 'shot.png' '${ticket.url}'`)
    const landed = await put(ticket.url, Png)
    expect(landed.status).toBe(201)
    const stored = await landed.json()
    expect(stored).toMatchObject({ key: ticket.key, mime: 'image/png', size: Png.byteLength })
    const kept = await files.get(ticket.key.slice('file:'.length))
    expect(kept?.bytes.byteLength).toBe(Png.byteLength)

    // Once only.
    const again = await put(ticket.url, Png)
    expect(again.status).toBe(404)
  })

  test('the size promised is the size taken; the type rules hold at the ticket', async () => {
    await connect()
    const ticket = await ok('file_upload_url', { filename: 'a.png', bytes: 10 })
    const wrong = await put(ticket.url, new Uint8Array(11))
    expect(wrong.status).toBe(400)
    expect(((await wrong.json()) as { error: string }).error).toContain('exactly 10 bytes')

    const svg = await text('file_upload_url', { filename: 'logo.svg', bytes: 100 })
    expect(svg.isError).toBe(true)
    expect(svg.text).toContain('PNG')
    const huge = await text('file_upload_url', { filename: 'big.png', bytes: 200 * 1024 * 1024 })
    expect(huge.isError).toBe(true)
    expect(huge.text).toContain('MB')
  })

  test('file_upload_from fetches through tsuru and keeps a ledger row either way', async () => {
    const real = globalThis.fetch
    setAddressLookup(async (name) =>
      name === 'cdn.example.com' ? [{ address: '93.184.216.34', family: 4 }] : [],
    )
    const spy = spyOn(globalThis, 'fetch').mockImplementation((async (
      input: string | URL | Request,
      init?: RequestInit,
    ) => {
      const url = String(input instanceof Request ? input.url : input)
      if (url === 'https://cdn.example.com/shots/home.png') {
        return new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/png' } })
      }
      return real(input, init)
    }) as typeof fetch)
    try {
      await connect()
      const got = await ok('file_upload_from', { url: 'https://cdn.example.com/shots/home.png' })
      expect(got).toMatchObject({ name: 'home.png', mime: 'image/png', size: 3 })
      expect(got.key).toMatch(/^file:/)
      const refused = await text('file_upload_from', { url: 'https://127.0.0.1/x.png' })
      expect(refused.isError).toBe(true)
      expect(refused.text).toContain('private')
      const ledger = listCapabilityCalls(ws).filter((row) => row.subject === 'file_upload_from')
      expect(ledger.map((row) => row.decision).sort()).toEqual(['auto', 'denied'])
      expect(ledger.every((row) => row.actorId === MEMBER.id && row.origin === 'agent')).toBe(true)
    } finally {
      spy.mockRestore()
      setAddressLookup(null)
    }
  })

  const tokenOf = (url: string) => url.split('/').pop() ?? ''
  const open = ({ workspaceId, actorId }: { workspaceId: string; actorId: string }) =>
    workspaceId === ws.id && actorId === MEMBER.id ? { ws, files } : null

  test('a ticket lapses after ten minutes, by the clock it is asked on', async () => {
    await connect()
    const ticket = await ok('file_upload_url', { filename: 'a.png', bytes: 4 })
    const later = Date.now() + 10 * 60 * 1000 + 1
    const lapsed = await answerUpload(
      new Request(ticket.url, { method: 'PUT', body: new Uint8Array(4) }),
      tokenOf(ticket.url),
      open,
      later,
    )
    expect(lapsed.status).toBe(404)
    expect(((await lapsed.json()) as { error: string }).error).toContain('expired')
  })

  test('a body sent chunked, with no Content-Length, is taken when its size is the one promised', async () => {
    await connect()
    const send = (url: string, sizes: number[]) =>
      answerUpload(
        new Request(url, {
          method: 'PUT',
          body: new ReadableStream({
            start(controller) {
              for (const size of sizes) controller.enqueue(new Uint8Array(size).fill(3))
              controller.close()
            },
          }),
          duplex: 'half',
        } as RequestInit),
        tokenOf(url),
        open,
      )
    const right = await ok('file_upload_url', { filename: 'c.png', bytes: 300 })
    const landed = await send(right.url, [100, 100, 100])
    expect(landed.status).toBe(201)
    const long = await ok('file_upload_url', { filename: 'd.png', bytes: 300 })
    expect((await send(long.url, [200, 200])).status).toBe(400)
    const short = await ok('file_upload_url', { filename: 'e.png', bytes: 300 })
    expect((await send(short.url, [100])).status).toBe(400)
  })

  test('20 unsent URLs a member at a time; another member’s are never taken to make room', async () => {
    const rins = issueTicket({
      workspaceId: ws.id,
      actorId: 'u-rin',
      name: 'r.png',
      mime: 'image/png',
      bytes: 1,
    })
    await connect()
    const mine: { url: string }[] = []
    for (let at = 0; at < 20; at++) {
      mine.push(await ok('file_upload_url', { filename: `${at}.png`, bytes: 1 }))
    }
    const twentyFirst = await text('file_upload_url', { filename: 'x.png', bytes: 1 })
    expect(twentyFirst.isError).toBe(true)
    expect(twentyFirst.text).toContain('20 upload URLs waiting')
    expect(takeTicket(rins.token)?.actorId).toBe('u-rin')
    // Sending them frees the room.
    for (const each of mine) {
      const sent = await answerUpload(
        new Request(each.url, { method: 'PUT', body: new Uint8Array(1) }),
        tokenOf(each.url),
        open,
      )
      expect(sent.status).toBe(201)
    }
    await ok('file_upload_url', { filename: 'again.png', bytes: 1 })
  })

  test('a member who left the workspace cannot land a ticket they took before', async () => {
    await connect()
    const ticket = await ok('file_upload_url', { filename: 'gone.png', bytes: 2 })
    const refused = await answerUpload(
      new Request(ticket.url, { method: 'PUT', body: new Uint8Array(2) }),
      tokenOf(ticket.url),
      () => null,
    )
    expect(refused.status).toBe(403)
  })

  test('file_upload_from ledgers a failure that is not tsuru’s too — a store that would not keep it', async () => {
    setAddressLookup(async () => [{ address: '93.184.216.34', family: 4 }])
    const fetchSpy = spyOn(globalThis, 'fetch').mockImplementation(
      (async () =>
        new Response(new Uint8Array([1, 2]), {
          headers: { 'content-type': 'image/png' },
        })) as unknown as typeof fetch,
    )
    const putSpy = spyOn(files, 'put').mockImplementation(async () => {
      throw new Error('the bucket said no')
    })
    try {
      await connect()
      const failed = await text('file_upload_from', { url: 'https://cdn.example.com/a.png' })
      expect(failed.isError).toBe(true)
      expect(failed.text).toContain('the bucket said no')
      const [row] = listCapabilityCalls(ws).filter((each) => each.subject === 'file_upload_from')
      expect(row).toMatchObject({ decision: 'denied', detail: 'the bucket said no' })
    } finally {
      putSpy.mockRestore()
      fetchSpy.mockRestore()
      setAddressLookup(null)
    }
  })
})
