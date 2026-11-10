import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import {
  createFileStore,
  getSheet,
  listSheets,
  localBlobStore,
  openWorkspace,
  type Workspace,
} from '@washi/repository'
import { answerMcp } from '../server'
import type { McpChange } from '../types'

const MEMBER = { id: 'u-rin', name: 'Rin' }

const README = `# Kome

A renderer for **paper** pages: \`/m/{slug}\` and <App> stay as typed.

## Install

\`\`\`bash
bun add kome
\`\`\`

| Step | Done |
| --- | --- |
| Install | yes |

- [x] Tests
- [ ] Docs
`

let ws: Workspace
let client: Client

beforeEach(async () => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  const session = {
    ws,
    viewer: { id: MEMBER.id, isOwner: false },
    member: MEMBER,
    listPeople: async () => [MEMBER],
    changed: (_kinds: McpChange[]) => {},
    files: createFileStore(ws, localBlobStore(mkdtempSync(join(tmpdir(), 'washi-import-')))),
    baseUrl: 'https://washi.test',
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

const call = async (name: string, args: Record<string, unknown> = {}) => {
  const result = await client.callTool({ name, arguments: args })
  const [first] = result.content as { text: string }[]
  if (result.isError) return { isError: true, value: first?.text ?? '' }
  return { isError: false, value: JSON.parse(first?.text ?? 'null') }
}

const ok = async (name: string, args: Record<string, unknown> = {}) => {
  const result = await call(name, args)
  if (result.isError) throw new Error(`${name}: ${String(result.value)}`)
  return result.value
}

describe('sheet_import: a README in one call (D136)', () => {
  test('Markdown becomes a checked page, written as the member, answered small', async () => {
    const home = await ok('sheet_create', {
      title: 'Docs',
      source: '<Sheet title="Docs"><Text>Home</Text></Sheet>',
    })
    const made = await ok('sheet_import', { markdown: README, parentId: home.id })
    expect(made).toMatchObject({
      title: 'Kome',
      parentId: home.id,
      kept: ['inline html <App> (line 3)'],
    })
    expect(made.url).toBe(`https://washi.test/w/test/p/${made.id}`)
    expect(typeof made.version).toBe('string')
    expect(made.source).toBeUndefined()

    const sheet = getSheet(ws, made.id)
    expect(sheet).toMatchObject({ title: 'Kome', editedBy: null })
    expect(sheet?.source).toContain('<Title level={2}>Install</Title>')
    expect(sheet?.source).toContain('<Code lang="bash">bun add kome</Code>')
    expect(sheet?.source).toContain('columns={["Step","Done"]}')
    expect(sheet?.source).toContain('<Item done>Tests</Item>')

    const checked = await ok('sheet_check', { source: sheet?.source, preview: true })
    expect(checked.ok).toBe(true)
    expect(checked.preview).toContain('`/m/{slug}` and <App> stay as typed')
  })

  test('an uploaded .md imports by its key; a dry run saves nothing', async () => {
    const upload = await ok('file_upload', {
      base64: Buffer.from(README).toString('base64'),
      filename: 'README.md',
    })
    const before = listSheets(ws).length
    const dry = await ok('sheet_import', { file: upload.key, title: 'Kome docs', dryRun: true })
    expect(dry).toMatchObject({
      ok: true,
      title: 'Kome docs',
      kept: ['inline html <App> (line 3)'],
    })
    expect(dry.source).toContain('<Sheet title="Kome docs">')
    expect(dry.source).toContain('<Title level={1}>Kome</Title>')
    expect(dry.preview).toContain('Install')
    expect(listSheets(ws)).toHaveLength(before)

    const made = await ok('sheet_import', { file: upload.key })
    expect(getSheet(ws, made.id)?.title).toBe('Kome')
  })

  test('a quoted heading and a picture holding " and \\ import and read back as written', async () => {
    const made = await ok('sheet_import', {
      markdown:
        '# Say "hi" to C:\\Users\\rin\n\n![The "big" one, C:\\Temp](https://example.com/a.png)\n\nPress <kbd>K</kbd>.\n',
    })
    expect(made.title).toBe('Say "hi" to C:\\Users\\rin')
    expect(made.kept).toEqual(['inline html <kbd> (line 5)', 'inline html </kbd> (line 5)'])
    const sheet = getSheet(ws, made.id)
    expect(sheet?.title).toBe('Say "hi" to C:\\Users\\rin')
    expect(sheet?.source).toContain('title={"Say \\"hi\\" to C:\\\\Users\\\\rin"}')
    expect(sheet?.source).toContain('alt={"The \\"big\\" one, C:\\\\Temp"}')
    const checked = await ok('sheet_check', { source: sheet?.source })
    expect(checked.ok).toBe(true)
  })

  test('refusals say why: both or neither, a picture, a page you cannot file under', async () => {
    const neither = await call('sheet_import', { title: 'x' })
    expect(neither.isError).toBe(true)
    expect(neither.value).toContain('send markdown')

    const both = await call('sheet_import', { markdown: '# a', file: 'file:abc' })
    expect(both.value).toContain('one')

    const pixel = await ok('file_upload', {
      base64:
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      filename: 'dot.png',
    })
    const picture = await call('sheet_import', { file: pixel.key })
    expect(picture.isError).toBe(true)
    expect(picture.value).toContain('reads Markdown or plain text')

    const lost = await call('sheet_import', { markdown: 'words', parentId: 'nope' })
    expect(lost.isError).toBe(true)
  })
})
