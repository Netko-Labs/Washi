import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import {
  createFileStore,
  getSheet,
  listComments,
  localBlobStore,
  openWorkspace,
  type Workspace,
} from '@washi/repository'
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
    isSteward: false,
    listPeople: async () => [MEMBER],
    changed: (kinds: McpChange[]) => void changes.push(kinds),
    files: createFileStore(ws, localBlobStore(mkdtempSync(join(tmpdir(), 'washi-mcp-')))),
    baseUrl: 'https://washi.test',
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

/** A 1×1 PNG: the smallest picture a page can wear. */
const PIXEL =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const ok = async (name: string, args: Record<string, unknown> = {}) => {
  const result = await call(name, args)
  if (result.isError) throw new Error(`${name}: ${String(result.value)}`)
  return result.value
}

describe('an agent builds a workspace without guessing (MCP fixes)', () => {
  test('the reference lists every primitive, and a page of many kinds passes the first check', async () => {
    const index = await ok('wsx_reference')
    const names = index.primitives.map((each: { name: string }) => each.name)
    expect(names).toEqual(expect.arrayContaining(['Title', 'Table', 'Callout', 'Subpages']))
    expect(names).not.toContain('Heading')
    const table = await ok('wsx_reference', { primitives: ['Table', 'Heading'] })
    expect(table.primitives[0].props.map((each: { key: string }) => each.key)).toContain('rows')
    expect(table.unknown[0].name).toBe('Heading')

    const source = `<Sheet title="Plan" icon="kanban" cover="preset:indigo">
  <Title>Plan</Title>
  <Text lead>What ships, **why**, and [the spec](https://example.com/spec).</Text>
  <Section title="Milestones">
    <List marker="check"><Item done>{"Route \`/m/{slug}\` live"}</Item><Item>Search</Item></List>
  </Section>
  <Callout tone="warning" title="Risk">Search may slip.</Callout>
  <Columns><Column><Stat label="Open" value={12} /></Column><Column><Badge tone="success">On track</Badge></Column></Columns>
  <Table columns={['Feature', 'Status']} rows={[['Sign-in', '**Done**'], ['Search', 'Doing']]} />
  <Divider />
  <Subpages layout="cards" />
</Sheet>`
    const check = await ok('sheet_check', { source, preview: true })
    expect(check.diagnostics.filter((d: { severity: string }) => d.severity === 'error')).toEqual(
      [],
    )
    expect(check.ok).toBe(true)
    expect(check.preview).toContain('Route `/m/{slug}` live')
  })

  test('icons and covers come from a list, and a miss names what would do', async () => {
    const catalog = await ok('catalog_list')
    expect(catalog.icons).toContain('rocket')
    expect(catalog.covers.presets.map((each: { key: string }) => each.key)).toContain('preset:sage')
    expect(catalog.covers.pictures.map((each: { key: string }) => each.key)).toContain(
      'picture:fjord',
    )
    expect(catalog.themes).toContain('washi')

    const check = await ok('sheet_check', {
      source: '<Sheet title="x" icon="bug" cover="preset:sagee"><Text>x</Text></Sheet>',
    })
    const said = check.diagnostics.map((each: { message: string }) => each.message).join(' ')
    expect(said).toContain('did you mean sage')
    expect(said).toContain('preset:persimmon')
    expect(said).toContain('rocket')
  })

  test('an upload is an icon and a cover, by MCP alone', async () => {
    const icon = await ok('file_upload', { base64: PIXEL, filename: 'favicon.png' })
    expect(icon.key).toMatch(/^file:/)
    expect(icon.mime).toBe('image/png')
    expect(icon.url).toStartWith('https://washi.test/api/files/')
    const cover = await ok('file_upload', { base64: PIXEL, filename: 'og-card.png' })
    const made = await ok('sheet_create', {
      title: 'Brand',
      source: `<Sheet title="Brand" icon="${icon.key}" cover="${cover.key}"><Text>x</Text></Sheet>`,
    })
    expect(getSheet(ws, made.id)).toMatchObject({ icon: icon.key, cover: cover.key })

    const svg = await call('file_upload', {
      base64: Buffer.from('<svg/>').toString('base64'),
      filename: 'favicon.svg',
    })
    expect(svg.isError).toBe(true)
    expect(String(svg.value)).toContain('PNG')

    // An extension that is an Object.prototype name is no known type, never a function.
    const odd = await call('file_upload', { base64: PIXEL, filename: 'favicon.constructor' })
    expect(odd.isError).toBe(true)
  })

  test('a mockup, a cover and an icon are drawn from HTML, never fetched (D126)', async () => {
    const cover = await ok('image_render', {
      purpose: 'cover',
      html: '<div style="background:linear-gradient(135deg,#1f2937,#4f46e5);color:white;padding:48px;font-size:64px;font-family:serif">Graphya</div>',
    })
    expect(cover.key).toMatch(/^file:/)
    expect(cover).toMatchObject({ width: 1500, height: 600 })
    expect(cover.wear).toBe(`<Sheet cover="${cover.key}">`)
    const icon = await ok('image_render', {
      purpose: 'icon',
      html: '<div style="background:#22c55e;border-radius:48px;width:100%;height:100%"></div>',
    })
    const made = await ok('sheet_create', {
      title: 'Drawn',
      source: `<Sheet title="Drawn" icon="${icon.key}" cover="${cover.key}"><Figure src="${cover.key}" alt="The cover" /></Sheet>`,
    })
    expect(getSheet(ws, made.id)).toMatchObject({ icon: icon.key, cover: cover.key })

    const remote = await call('image_render', { html: '<img src="https://example.com/x.png" />' })
    expect(remote.isError).toBe(true)
    expect(String(remote.value)).toContain('nothing is fetched')
  })

  test('a write answers in under 1 KB, whatever the page weighs', async () => {
    const items = Array.from(
      { length: 300 },
      (_, at) => `<Item>Requirement ${at}: ${'x'.repeat(150)}</Item>`,
    )
    const source = `<Sheet title="Spec"><List>${items.join('')}</List></Sheet>`
    expect(source.length).toBeGreaterThan(50_000)
    const result = await client.callTool({
      name: 'sheet_create',
      arguments: { title: 'Spec', source },
    })
    const [first] = result.content as { text: string }[]
    expect(first?.text.length).toBeLessThan(1024)
    const made = JSON.parse(first?.text ?? '{}')
    expect(made).toMatchObject({ title: 'Spec', parentId: null })
    expect(made.version).toBeString()
    expect(made.url).toBe(`https://washi.test/w/test/p/${made.id}`)
    expect(made.source).toBeUndefined()
    const full = await ok('sheet_replace', { id: made.id, title: 'Spec', source, verbose: true })
    expect(full.source).toBe(source)
  })

  test('a typo is one small edit, merged with a teammate’s typing since', async () => {
    const made = await ok('sheet_create', {
      title: 'Doc',
      source: '<Sheet title="Doc">\n  <Text>Teh first line</Text>\n  <Text>Second</Text>\n</Sheet>',
    })
    // A teammate types into the page after the agent read it.
    await ok('sheet_replace', {
      id: made.id,
      title: 'Doc',
      source:
        '<Sheet title="Doc">\n  <Text>Teh first line</Text>\n  <Text>Second, by Rin</Text>\n</Sheet>',
      baseVersion: made.version,
    })
    const fixed = await ok('sheet_edit', {
      id: made.id,
      baseVersion: made.version,
      edits: [{ old: 'Teh', new: 'The' }],
    })
    expect(fixed.title).toBe('Doc')
    expect(getSheet(ws, made.id)?.source).toContain('The first line')
    expect(getSheet(ws, made.id)?.source).toContain('Second, by Rin')

    const twice = await call('sheet_edit', { id: made.id, edits: [{ old: 'Text', new: 'Title' }] })
    expect(twice.isError).toBe(true)
    expect(String(twice.value)).toContain('4 times')
    const broken = await call('sheet_edit', {
      id: made.id,
      edits: [
        { old: 'The first', new: 'A first' },
        { old: '</Sheet>', new: '' },
      ],
    })
    expect(broken.isError).toBe(true)
    expect(getSheet(ws, made.id)?.source).toContain('The first line')
  })

  test('a hundred rows go in with one call, a relation by its row’s name', async () => {
    await ok('db_define', {
      spec: { name: 'epics', columns: [{ name: 'name', type: 'text' }] },
    })
    await ok('db_mutate', {
      mutation: {
        kind: 'insert',
        table: 'epics',
        data: [{ name: 'M4 · Every stat live' }, { name: 'M5' }],
      },
    })
    // Adding one column to issues sends that column alone; title and status stay.
    await ok('db_define', {
      spec: { name: 'issues', columns: [{ name: 'epic', type: 'relation', table: 'epics' }] },
    })
    const rows = Array.from({ length: 100 }, (_, at) => ({
      title: `Issue ${at}`,
      status: 'Todo',
      epic: [at % 2 ? 'm5' : ' M4 · Every stat live '],
    }))
    const added = await ok('db_mutate', {
      mutation: { kind: 'insert', table: 'issues', data: rows },
    })
    expect(added.ids).toHaveLength(100)
    const epics = await ok('db_query', { query: { table: 'epics', orderBy: { column: 'name' } } })
    const [m4] = epics.rows
    const first = await ok('db_query', {
      query: { table: 'issues', where: [{ column: 'id', op: 'eq', value: added.ids[0] }] },
    })
    expect(first.rows[0]).toMatchObject({ title: 'Issue 0', status: 'Todo', epic: [m4.id] })

    const unmatched = await call('db_mutate', {
      mutation: { kind: 'insert', table: 'issues', data: [{ title: 'x', epic: ['M9'] }] },
    })
    expect(unmatched.isError).toBe(true)
    expect(String(unmatched.value)).toContain('"M9"')
    const bad = await call('db_mutate', {
      mutation: {
        kind: 'insert',
        table: 'issues',
        data: [{ title: 'ok' }, { title: 'bad', status: 'Nope' }],
      },
    })
    expect(bad.isError).toBe(true)
    expect(String(bad.value)).toContain('row 2')
    const all = await ok('db_query', { query: { table: 'issues', limit: 1000 } })
    expect(all.rows).toHaveLength(102)
  })

  test('adding one select option is one small call that leaves the other columns be', async () => {
    await ok('db_change_column', {
      change: { kind: 'option', table: 'issues', column: 'status', to: 'Blocked', group: 'doing' },
    })
    const [issues] = (await ok('db_list_tables')).filter(
      (table: { name: string }) => table.name === 'issues',
    )
    const columns = issues.spec.columns
    expect(columns.map((column: { name: string }) => column.name)).toEqual(['title', 'status'])
    expect(columns[1].groups.doing).toEqual(['Doing', 'Blocked'])
  })
})
