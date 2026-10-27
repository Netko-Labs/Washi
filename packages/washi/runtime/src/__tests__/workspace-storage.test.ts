import { afterAll, afterEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createEmbeddedControlPlane } from '@washi/control/embedded'
import type { StorageConfig } from '@washi/trpc'
import { createRuntime } from '../runtime'
import type { Runtime } from '../types'

const objects = new Map<string, Uint8Array>()
const provider = Bun.serve({
  port: 0,
  async fetch(request) {
    const path = new URL(request.url).pathname
    if (request.method === 'PUT') {
      objects.set(path, new Uint8Array(await request.arrayBuffer()))
      return new Response(null)
    }
    if (request.method === 'DELETE') {
      objects.delete(path)
      return new Response(null, { status: 204 })
    }
    const body = objects.get(path)
    if (!body) return new Response(null, { status: 404 })
    return new Response(request.method === 'HEAD' ? null : body, {
      headers: { 'content-length': String(body.byteLength) },
    })
  },
})
afterAll(() => {
  void provider.stop(true)
})

const BUCKET: StorageConfig = {
  endpoint: `http://127.0.0.1:${provider.port}`,
  region: 'auto',
  bucket: 'team',
  prefix: 'washi',
  accessKeyId: 'AKIAEXAMPLE1234',
  secretAccessKey: 'not-a-real-secret',
}

let dir = ''
let runtime: Runtime | null = null
let current: StorageConfig | null = null
afterEach(() => {
  runtime?.close()
  runtime = null
  current = null
  objects.clear()
  if (dir) rmSync(dir, { recursive: true, force: true })
})

const filesOf = () => {
  dir = mkdtempSync(join(tmpdir(), 'washi-storage-'))
  runtime = createRuntime({
    mode: 'hosted',
    control: createEmbeddedControlPlane({ workspaceId: 'w1' }),
    dataDir: dir,
    workspaceStorage: async () => current,
  })
  return runtime.resolve('w1').files
}
const upload = (files: ReturnType<typeof filesOf>, name: string) =>
  files.put({ name, mime: 'image/png', bytes: new TextEncoder().encode(name) })
const onDisk = (id: string) => existsSync(join(dir, 'w1.files', id))

describe('a workspace that brings its own bucket', () => {
  test('new uploads go to the bucket; uploads from before still open from the server', async () => {
    const files = filesOf()
    const before = await upload(files, 'before')
    current = BUCKET
    const after = await upload(files, 'after')

    expect(onDisk(before.id)).toBe(true)
    expect(onDisk(after.id)).toBe(false)
    expect(objects.has(`/team/washi/w1/${after.id}`)).toBe(true)
    expect((await files.get(before.id))?.file.name).toBe('before')
    expect((await files.get(after.id))?.file.name).toBe('after')
  })

  test('removing it sends the next upload back to the server, without a restart', async () => {
    const files = filesOf()
    current = BUCKET
    const inBucket = await upload(files, 'bucket')
    current = null
    const back = await upload(files, 'back')

    expect(onDisk(back.id)).toBe(true)
    expect(objects.has(`/team/washi/w1/${inBucket.id}`)).toBe(true)
  })

  test('a changed bucket takes the next upload', async () => {
    const files = filesOf()
    current = BUCKET
    await upload(files, 'first')
    current = { ...BUCKET, prefix: 'moved' }
    const moved = await upload(files, 'second')
    expect(objects.has(`/team/moved/w1/${moved.id}`)).toBe(true)
  })
})
