import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import {
  createFileStore,
  type FileStore,
  localBlobStore,
  openWorkspace,
  type Workspace,
} from '@washi/repository'
import { answerMcp } from '../server'

const MEMBER = { id: 'u-juan', name: 'Juan' }

let ws: Workspace
let other: Workspace
let otherFiles: FileStore
let client: Client

const storeFor = (workspace: Workspace) =>
  createFileStore(workspace, localBlobStore(mkdtempSync(join(tmpdir(), 'washi-file-get-'))))

beforeEach(async () => {
  ws = openWorkspace({ id: 'here', path: ':memory:' })
  other = openWorkspace({ id: 'there', path: ':memory:' })
  otherFiles = storeFor(other)
  const session = {
    ws,
    viewer: { id: MEMBER.id, isOwner: false },
    isSteward: false,
    member: MEMBER,
    listPeople: async () => [MEMBER],
    changed: () => {},
    files: storeFor(ws),
  }
  const fetch = (input: string | URL | Request, init?: RequestInit) =>
    answerMcp(
      input instanceof Request ? new Request(input, init) : new Request(String(input), init),
      session,
    )
  client = new Client({ name: 'test-agent', version: '1.0.0' })
  await client.connect(
    new StreamableHTTPClientTransport(new URL('http://washi.test/mcp/here'), { fetch }),
  )
})

afterEach(async () => {
  await client.close()
  ws.close()
  other.close()
})

type Block = { type: string; text?: string; data?: string; mimeType?: string }

const blocks = async (name: string, args: Record<string, unknown>) => {
  const result = await client.callTool({ name, arguments: args })
  return { isError: Boolean(result.isError), content: result.content as Block[] }
}

const pngSize = (base64: string) => {
  const bytes = Buffer.from(base64, 'base64')
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

describe('file_get: an agent sees what it made (D138)', () => {
  test('a drawn picture comes back as an image, drawn smaller to maxWidth', async () => {
    const drawn = await blocks('image_render', {
      html: '<div style="display:flex;width:100%;height:100%;background:#dd9a3f"><svg viewBox="0 0 10 10" style="width:400px;height:400px"><defs><clipPath id="c"><circle cx="5" cy="5" r="4"/></clipPath></defs><rect width="10" height="10" fill="#14100c" clip-path="url(#c)"/></svg></div>',
      purpose: 'cover',
    })
    expect(drawn.isError).toBe(false)
    const { key } = JSON.parse(drawn.content[0]?.text ?? '{}') as { key: string }

    const seen = await blocks('file_get', { id: key, maxWidth: 300 })
    expect(seen.isError).toBe(false)
    const [image, about] = seen.content
    expect(image).toMatchObject({ type: 'image', mimeType: 'image/png' })
    expect(pngSize(image?.data ?? '')).toEqual({ width: 300, height: 120 })
    expect(JSON.parse(about?.text ?? '{}')).toMatchObject({
      key,
      size: '1500×600',
      shownAt: '300×120',
    })

    // Small enough already, it comes back as stored — the bare id works too.
    const whole = await blocks('file_get', { id: key.replace('file:', ''), maxWidth: 2048 })
    expect(pngSize(whole.content[0]?.data ?? '')).toEqual({ width: 1500, height: 600 })
  })

  test('a text upload comes back as its words', async () => {
    const up = await blocks('file_upload', {
      base64: Buffer.from('# Notes\n\nShip {it} <now>.').toString('base64'),
      filename: 'notes.md',
    })
    const { key } = JSON.parse(up.content[0]?.text ?? '{}') as { key: string }
    const read = await blocks('file_get', { id: key })
    expect(read.content).toEqual([{ type: 'text', text: '# Notes\n\nShip {it} <now>.' }])
  })

  test('a file it cannot show says what it is', async () => {
    const up = await blocks('file_upload', {
      base64: Buffer.from('%PDF-1.4 tiny').toString('base64'),
      filename: 'plan.pdf',
    })
    const { key } = JSON.parse(up.content[0]?.text ?? '{}') as { key: string }
    const read = await blocks('file_get', { id: key })
    expect(JSON.parse(read.content[0]?.text ?? '{}')).toMatchObject({
      key,
      mime: 'application/pdf',
      shown: false,
    })
  })

  test('another workspace’s upload is not here', async () => {
    const theirs = await otherFiles.put({
      name: 'secret.txt',
      mime: 'text/plain',
      bytes: new TextEncoder().encode('not yours'),
    })
    const read = await blocks('file_get', { id: `file:${theirs.id}` })
    expect(read.isError).toBe(true)
    expect(read.content[0]?.text).toContain('not an upload in this workspace')
    expect(read.content[0]?.text).not.toContain('not yours')
  })
})
