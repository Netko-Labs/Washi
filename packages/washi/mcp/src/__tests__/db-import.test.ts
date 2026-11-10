import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { createFileStore, localBlobStore, openWorkspace, type Workspace } from '@washi/repository'
import { defineUserTable, rowActivity, runQuery } from '@washi/service'
import { answerMcp } from '../server'
import type { McpChange } from '../types'

const MEMBER = { id: 'u-juan', name: 'Juan' }

let ws: Workspace
let changes: McpChange[][]
let client: Client

beforeEach(async () => {
  ws = openWorkspace({ id: 'import', path: ':memory:' })
  changes = []
  defineUserTable(ws, {
    name: 'backlog',
    columns: [
      { name: 'title', type: 'text' },
      {
        name: 'status',
        type: 'status',
        groups: { todo: ['Todo'], doing: ['Doing'], done: ['Done'] },
      },
      { name: 'priority', type: 'select', options: ['P1', 'P2', 'P3'] },
    ],
  })
  const session = {
    ws,
    viewer: { id: MEMBER.id, isOwner: false },
    isSteward: false,
    member: MEMBER,
    listPeople: async () => [MEMBER],
    changed: (kinds: McpChange[]) => void changes.push(kinds),
    files: createFileStore(ws, localBlobStore(mkdtempSync(join(tmpdir(), 'washi-import-')))),
  }
  const fetch = (input: string | URL | Request, init?: RequestInit) =>
    answerMcp(
      input instanceof Request ? new Request(input, init) : new Request(String(input), init),
      session,
    )
  client = new Client({ name: 'test-agent', version: '1.0.0' })
  await client.connect(
    new StreamableHTTPClientTransport(new URL('http://washi.test/mcp/import'), { fetch }),
  )
})

afterEach(async () => {
  await client.close()
  ws.close()
})

const call = async (name: string, args: Record<string, unknown>) => {
  const result = await client.callTool({ name, arguments: args })
  const [first] = result.content as { text: string }[]
  const value = JSON.parse(first?.text ?? 'null')
  if (result.isError) throw new Error(`${name}: ${String(value)}`)
  return value
}

const base64 = (text: string) => Buffer.from(text, 'utf8').toString('base64')

describe('db_import over MCP (D137)', () => {
  test('an uploaded CSV lands as the member: a refused row said, 600 rows in two batches', async () => {
    const lines = ['Issue,Status,Priority']
    for (let at = 1; at <= 600; at++) lines.push(`"Issue ${at}, again",todo,p${(at % 3) + 1}`)
    lines.push('Broken,Someday,P1')
    const upload = await call('file_upload', {
      base64: base64(lines.join('\n')),
      filename: 'backlog.csv',
    })

    const dry = await call('db_import', {
      table: 'backlog',
      file: upload.key,
      map: { Issue: 'title' },
      dryRun: true,
    })
    expect(dry).toMatchObject({ dryRun: true, inserted: 0, wouldInsert: 600, refusedTotal: 1 })
    expect(runQuery(ws, { table: 'backlog' }).rows).toHaveLength(0)

    const done = await call('db_import', {
      table: 'backlog',
      file: upload.key,
      map: { Issue: 'title' },
    })
    expect(done.inserted).toBe(600)
    expect(done.batches).toEqual([
      { from: 1, to: 500, inserted: 500 },
      { from: 501, to: 600, inserted: 100 },
    ])
    expect(done.refused).toEqual([
      { row: 601, line: 602, why: expect.stringContaining('expected one of') },
    ])
    const first = runQuery(ws, {
      table: 'backlog',
      orderBy: { column: 'title', direction: 'asc' },
      limit: 1,
    }).rows[0]
    expect(first).toMatchObject({ title: 'Issue 1, again', status: 'Todo', priority: 'P2' })
    expect(rowActivity(ws, String(done.ids[0])).changes[0]).toMatchObject({ by: MEMBER.id })
    expect(changes).toContainEqual(['data', 'page'])
  })

  test('rows sent inline as JSON; exactly one source', async () => {
    const done = await call('db_import', {
      table: 'backlog',
      json: [{ title: 'Inline', status: 'Doing' }],
    })
    expect(done.inserted).toBe(1)
    const tsv = await call('file_upload', {
      base64: base64('title\tpriority\nTabbed, with a comma\tP3\n'),
      filename: 'rows.tsv',
    })
    expect((await call('db_import', { table: 'backlog', file: tsv.key })).inserted).toBe(1)
    expect(
      runQuery(ws, { table: 'backlog', where: [{ column: 'priority', op: 'eq', value: 'P3' }] })
        .rows[0],
    ).toMatchObject({ title: 'Tabbed, with a comma' })
    await expect(
      call('db_import', { table: 'backlog', csv: 'title\nA', json: [{ title: 'B' }] }),
    ).rejects.toThrow('exactly one')
    const picture = await call('file_upload', {
      base64:
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      filename: 'pixel.png',
    })
    await expect(call('db_import', { table: 'backlog', file: picture.key })).rejects.toThrow(
      'not CSV, TSV or JSON',
    )
  })
})
