import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { getSheet, listComments, openWorkspace, type Workspace } from '@washi/repository'
import { defineUserTable, openRowPage, rowActivity, runMutation } from '@washi/service'
import { answerMcp } from '../server'
import type { McpChange } from '../types'

const MEMBER = { id: 'u-juan', name: 'Juan' }

let ws: Workspace
let changes: McpChange[][]
let client: Client

beforeEach(async () => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  changes = []
  defineUserTable(ws, {
    name: 'issues',
    columns: [
      { name: 'title', type: 'text' },
      {
        name: 'status',
        type: 'status',
        groups: { todo: ['Todo'], doing: ['Doing'], done: ['Done'] },
      },
    ],
  })
  runMutation(ws, {
    kind: 'insert',
    table: 'issues',
    data: { title: 'Fix the login', status: 'Todo' },
  })
  runMutation(ws, { kind: 'insert', table: 'issues', data: { title: 'Old thing', status: 'Done' } })
  const session = {
    ws,
    viewer: { id: MEMBER.id, isOwner: false },
    member: MEMBER,
    listPeople: async () => [MEMBER],
    changed: (kinds: McpChange[]) => void changes.push(kinds),
  }
  // The transport speaks real HTTP shapes; this fetch answers in-process instead of on a port.
  const fetch = (input: string | URL | Request, init?: RequestInit) =>
    answerMcp(
      input instanceof Request ? new Request(input, init) : new Request(String(input), init),
      session,
    )
  client = new Client({ name: 'test-agent', version: '1.0.0' })
  await client.connect(
    new StreamableHTTPClientTransport(new URL('http://washi.test/mcp/test'), { fetch }),
  )
})

afterEach(async () => {
  await client.close()
  ws.close()
})

const call = async (name: string, args: Record<string, unknown> = {}) => {
  const result = await client.callTool({ name, arguments: args })
  const [first] = result.content as { text: string }[]
  if (result.isError && !first?.text.startsWith('"')) return { isError: true, value: first?.text }
  return { isError: Boolean(result.isError), value: JSON.parse(first?.text ?? 'null') }
}

describe('Washi over MCP (D101)', () => {
  test('lists pages, tables and comments — and nothing that reaches out', async () => {
    const { tools } = await client.listTools()
    const names = tools.map((each) => each.name)
    expect(names).toEqual(
      expect.arrayContaining([
        'db_query',
        'db_mutate',
        'db_trash_table',
        'sheet_get',
        'sheet_replace',
        'comment_add',
      ]),
    )
    for (const off of ['fetch_url', 'web_search', 'action_run', 'set_conversation_title']) {
      expect(names).not.toContain(off)
    }
    expect(tools.find((each) => each.name === 'db_query')?.annotations?.readOnlyHint).toBe(true)
    expect(tools.find((each) => each.name === 'db_mutate')?.annotations?.readOnlyHint).toBe(false)
  })

  test('works a backlog: open issues, a comment on the row, the status moved — all as the member', async () => {
    const open = await call('db_query', {
      query: { table: 'issues', where: [{ column: 'status', op: 'ne', value: 'Done' }] },
    })
    if (open.isError) throw new Error(String(open.value))
    expect(open.value.rows.map((row: { title: string }) => row.title)).toEqual(['Fix the login'])
    const issue = open.value.rows[0].id as string

    const said = await call('comment_add', { recordId: issue, body: 'Fixed in #42' })
    expect(said.isError).toBe(false)
    expect(listComments(ws, openRowPage(ws, issue))[0]).toMatchObject({
      body: 'Fixed in #42',
      authorId: MEMBER.id,
    })

    await call('db_mutate', {
      mutation: {
        kind: 'update',
        table: 'issues',
        where: [{ column: 'id', op: 'eq', value: issue }],
        data: { status: 'Done' },
      },
    })
    expect(rowActivity(ws, issue).changes[0]).toMatchObject({ by: MEMBER.id })
    expect(changes).toContainEqual(['data', 'page'])
    expect(changes[0]).toEqual(['page'])
  })

  test('a page written over MCP is the person’s, and a bad call says why without breaking', async () => {
    const made = await call('sheet_create', {
      title: 'Notes',
      source: '<Sheet title="Notes"><Text>from an agent</Text></Sheet>',
    })
    expect(getSheet(ws, made.value.id)).toMatchObject({ editedBy: null })
    expect(changes).toContainEqual(['page'])

    const refused = await call('db_query', { query: { table: 'nope' } })
    expect(refused.isError).toBe(true)
    expect(String(refused.value)).toContain('nope')
  })
})
