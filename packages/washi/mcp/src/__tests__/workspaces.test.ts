import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { listSheets, openWorkspace, type Workspace } from '@washi/repository'
import { answerMcp } from '../server'
import type { McpChange, McpSession, McpWorkspaces } from '../types'

const MEMBER = { id: 'u-juan', name: 'Juan' }

let home: Workspace
let studio: Workspace
let changed: { workspace: string; kinds: McpChange[] }[]
let client: Client

const sessionOf = (ws: Workspace): McpSession => ({
  ws,
  viewer: { id: MEMBER.id, isOwner: false },
  member: MEMBER,
  listPeople: async () => [MEMBER],
  changed: (kinds) => void changed.push({ workspace: ws.id, kinds }),
})

async function connect(workspaces?: McpWorkspaces) {
  const session = sessionOf(home)
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

const call = async (name: string, args: Record<string, unknown> = {}) => {
  const result = await client.callTool({ name, arguments: args })
  const [first] = result.content as { text: string }[]
  return { isError: Boolean(result.isError), value: JSON.parse(first?.text ?? 'null') }
}

const TWO: () => McpWorkspaces = () => ({
  list: [
    { id: 'home', name: 'Graphya' },
    { id: 'studio', name: 'Netko Studio' },
  ],
  open: async (id) =>
    id === 'home' ? sessionOf(home) : id === 'studio' ? sessionOf(studio) : null,
})

beforeEach(() => {
  home = openWorkspace({ id: 'home', path: ':memory:' })
  studio = openWorkspace({ id: 'studio', path: ':memory:' })
  changed = []
})

afterEach(async () => {
  await client.close()
  home.close()
  studio.close()
})

describe('one sign-in, several workspaces (D124)', () => {
  test('workspace_list names them, the default first', async () => {
    await connect(TWO())
    const { value } = await call('workspace_list')
    expect(value).toEqual([
      { id: 'home', name: 'Graphya', isDefault: true, guide: null },
      { id: 'studio', name: 'Netko Studio', isDefault: false, guide: null },
    ])
    const { tools } = await client.listTools()
    const create = tools.find((tool) => tool.name === 'sheet_create')
    expect(Object.keys(create?.inputSchema.properties ?? {})).toContain('workspace')
  })

  test('a call acts in the default, or in the workspace it names by id or by name', async () => {
    await connect(TWO())
    const source = (title: string) => `<Sheet title="${title}"><Text>x</Text></Sheet>`
    await call('sheet_create', { title: 'Plan', source: source('Plan') })
    await call('sheet_create', { title: 'Brand', source: source('Brand'), workspace: 'studio' })
    await call('sheet_create', { title: 'Logo', source: source('Logo'), workspace: 'netko studio' })
    expect(listSheets(home).map((sheet) => sheet.title)).toEqual(['Plan'])
    expect(
      listSheets(studio)
        .map((sheet) => sheet.title)
        .sort(),
    ).toEqual(['Brand', 'Logo'])
    // Each write tells the workspace it landed in.
    expect(changed.map((each) => each.workspace)).toEqual(['home', 'studio', 'studio'])
    const listed = await call('sheet_list', { workspace: 'studio' })
    expect(listed.value.map((sheet: { title: string }) => sheet.title).sort()).toEqual([
      'Brand',
      'Logo',
    ])
  })

  test('a workspace the sign-in does not reach is refused, naming the ones it does', async () => {
    await connect(TWO())
    const refused = await call('sheet_list', { workspace: 'elsewhere' })
    expect(refused.isError).toBe(true)
    expect(String(refused.value)).toContain('Graphya (home)')
    expect(String(refused.value)).toContain('Netko Studio (studio)')
  })

  test('one they have left reads the same as one never granted', async () => {
    await connect({ ...TWO(), open: async (id) => (id === 'home' ? sessionOf(home) : null) })
    const refused = await call('sheet_list', { workspace: 'studio' })
    expect(refused.isError).toBe(true)
    expect(String(refused.value)).toContain('is not a workspace you can work in here')
  })

  test('a single workspace takes no workspace argument', async () => {
    await connect()
    const { tools } = await client.listTools()
    const create = tools.find((tool) => tool.name === 'sheet_create')
    expect(Object.keys(create?.inputSchema.properties ?? {})).not.toContain('workspace')
    expect(tools.map((tool) => tool.name)).not.toContain('workspace_list')
  })
})
