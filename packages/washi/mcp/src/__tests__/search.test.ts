import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { openWorkspace, type Workspace } from '@washi/repository'
import { createSheetFromSource, defineUserTable, runMutation, trashUserTable } from '@washi/service'
import { answerMcp } from '../server'

const MEMBER = { id: 'u-juan', name: 'Juan' }

let ws: Workspace
let client: Client

beforeEach(async () => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  defineUserTable(ws, {
    name: 'issues',
    columns: [
      { name: 'title', type: 'text' },
      { name: 'notes', type: 'text' },
      {
        name: 'status',
        type: 'status',
        groups: { todo: ['Todo'], doing: ['Doing'], done: ['Done'] },
      },
    ],
  })
  defineUserTable(ws, { name: 'scratch', columns: [{ name: 'body', type: 'text' }] })
  runMutation(ws, {
    kind: 'insert',
    table: 'issues',
    data: [
      { title: 'Fix the login', notes: 'Times out behind the corporate proxy', status: 'Todo' },
      { title: 'Old thing', status: 'Done' },
    ],
  })
  runMutation(ws, { kind: 'insert', table: 'scratch', data: { body: 'proxy settings draft' } })
  createSheetFromSource(
    ws,
    {
      title: 'Network',
      source: '<Sheet title="Network"><Text>The proxy lives here.</Text></Sheet>',
    },
    null,
    null,
  )
  const session = {
    ws,
    viewer: { id: MEMBER.id, isOwner: false },
    isSteward: false,
    member: MEMBER,
    listPeople: async () => [MEMBER],
    changed: () => {},
  }
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

const ok = async (name: string, args: Record<string, unknown> = {}) => {
  const result = await client.callTool({ name, arguments: args })
  const [first] = result.content as { text: string }[]
  if (result.isError) throw new Error(`${name}: ${first?.text}`)
  return JSON.parse(first?.text ?? 'null')
}

describe('search covers table rows (D140)', () => {
  test('a row is found with its table, id and column, beside the pages', async () => {
    const found = await ok('search', { term: 'proxy' })
    expect(found.pages.map((page: { title: string }) => page.title)).toEqual(['Network'])
    const issue = found.rows.find((row: { table: string }) => row.table === 'issues')
    expect(issue).toMatchObject({ table: 'issues', title: 'Fix the login', column: 'notes' })
    expect(issue.snippet).toContain('corporate proxy')
    // The id opens the row.
    const read = await ok('db_query', {
      query: { table: 'issues', where: [{ column: 'id', op: 'eq', value: issue.recordId }] },
    })
    expect(read.rows[0].title).toBe('Fix the login')
  })

  test('a deleted row and a trashed table are not found', async () => {
    const before = await ok('search', { term: 'proxy' })
    expect(before.rows).toHaveLength(2)
    const issue = before.rows.find((row: { table: string }) => row.table === 'issues')
    await ok('db_mutate', {
      mutation: {
        kind: 'delete',
        table: 'issues',
        where: [{ column: 'id', op: 'eq', value: issue.recordId }],
      },
    })
    const scratch = (await ok('db_list_tables')).find(
      (table: { name: string }) => table.name === 'scratch',
    )
    trashUserTable(ws, scratch.id)
    expect((await ok('search', { term: 'proxy' })).rows).toEqual([])
  })

  test('db_list_tables counts each table’s live rows', async () => {
    const counts = async () =>
      Object.fromEntries(
        (await ok('db_list_tables')).map((table: { name: string; rows: number }) => [
          table.name,
          table.rows,
        ]),
      )
    expect(await counts()).toEqual({ issues: 2, scratch: 1 })
    await ok('db_mutate', {
      mutation: {
        kind: 'delete',
        table: 'issues',
        where: [{ column: 'status', op: 'eq', value: 'Done' }],
      },
    })
    expect(await counts()).toEqual({ issues: 1, scratch: 1 })
  })
})
