import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import {
  createFileStore,
  type FileStore,
  getSheet,
  localBlobStore,
  openWorkspace,
  type Workspace,
} from '@washi/repository'
import { answerMcp } from '../server'
import type { McpSession } from '../types'
import { answerUpload } from '../uploads'

const HELPER = resolve(import.meta.dir, '../../../../../plugins/washi/scripts/washi.mjs')
const PIXEL =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

let ws: Workspace
let files: FileStore
let server: ReturnType<typeof Bun.serve>
/** A server from before upload URLs: no lender, so no file_upload_url. */
let older: ReturnType<typeof Bun.serve>
const dir = mkdtempSync(join(tmpdir(), 'washi-helper-'))

beforeAll(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  files = createFileStore(ws, localBlobStore(dir))
  const session: McpSession = {
    ws,
    viewer: { id: 'u-juan', isOwner: false },
    member: { id: 'u-juan', name: 'Juan' },
    listPeople: async () => [],
    changed: () => {},
    files,
    uploads: { url: (ticket) => new URL(`/api/uploads/${ticket}`, server.url).href },
  }
  server = Bun.serve({
    port: 0,
    fetch: (request) => {
      const { pathname } = new URL(request.url)
      if (request.method === 'PUT' && pathname.startsWith('/api/uploads/')) {
        return answerUpload(request, pathname.split('/').pop() ?? '', () => ({ ws, files }))
      }
      return request.headers.get('authorization') === 'Bearer washi_pat_test'
        ? answerMcp(request, session)
        : new Response('no', { status: 401 })
    },
  })
  older = Bun.serve({
    port: 0,
    fetch: (request) => answerMcp(request, { ...session, uploads: undefined }),
  })
})

afterAll(() => {
  server.stop(true)
  older.stop(true)
  ws.close()
})

async function helper(...args: string[]) {
  return helperAt(server, ...args)
}

async function helperAt(at: ReturnType<typeof Bun.serve>, ...args: string[]) {
  const run = Bun.spawn(['bun', HELPER, ...args], {
    env: { ...process.env, WASHI_MCP_URL: at.url.href, WASHI_TOKEN: 'washi_pat_test' },
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const [out, err, code] = [
    await new Response(run.stdout).text(),
    await new Response(run.stderr).text(),
    await run.exited,
  ]
  return { out, err, code }
}

describe('the plugin’s helper writes from local files (MCP fix 6)', () => {
  test('a 60 KB page lands from its file, and the answer stays small', async () => {
    const items = Array.from(
      { length: 350 },
      (_, at) => `<Item>Line ${at} ${'y'.repeat(150)}</Item>`,
    )
    const source = `<Sheet title="Spec"><List>${items.join('')}</List></Sheet>`
    expect(source.length).toBeGreaterThan(55_000)
    const file = join(dir, 'spec.wsx')
    writeFileSync(file, source)
    const { out, code, err } = await helper('sheet_create', 'title=Spec', `source=@${file}`)
    expect(err).toBe('')
    expect(code).toBe(0)
    expect(out.length).toBeLessThan(1024)
    expect(getSheet(ws, JSON.parse(out).id)?.source).toBe(source)
  })

  test('a picture uploads from its path; a refusal exits non-zero with the words', async () => {
    const png = join(dir, 'og-card.png')
    writeFileSync(png, Buffer.from(PIXEL, 'base64'))
    const uploaded = await helper('upload', png)
    expect(uploaded.code).toBe(0)
    expect(JSON.parse(uploaded.out).key).toMatch(/^file:/)

    const rows = join(dir, 'rows.json')
    writeFileSync(rows, JSON.stringify({ kind: 'insert', table: 'nope', data: [{ a: 1 }] }))
    const refused = await helper('db_mutate', `mutation:=@${rows}`)
    expect(refused.code).toBe(1)
    expect(refused.out).toContain('nope')
  })

  test('a 5 MB picture goes by one upload URL, never as base64 in a tool call (D135)', async () => {
    const big = join(dir, 'shot.png')
    writeFileSync(big, new Uint8Array(5 * 1024 * 1024).fill(9))
    const uploaded = await helper('upload', big, '--workspace', 'test')
    expect(uploaded.err).toBe('')
    expect(uploaded.code).toBe(0)
    const { key, size } = JSON.parse(uploaded.out)
    expect(size).toBe(5 * 1024 * 1024)
    expect((await files.get(key.slice('file:'.length)))?.file.name).toBe('shot.png')

    // A server without upload URLs still takes the file, as base64.
    const small = join(dir, 'pixel.png')
    writeFileSync(small, Buffer.from(PIXEL, 'base64'))
    const fallback = await helperAt(older, 'upload', small)
    expect(fallback.code).toBe(0)
    expect(JSON.parse(fallback.out).key).toMatch(/^file:/)
  })
})
