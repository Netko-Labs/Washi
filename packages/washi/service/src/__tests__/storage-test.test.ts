import { afterAll, describe, expect, test } from 'bun:test'
import type { StorageConfig } from '@washi/domain'
import { testStorage } from '../files/storage'

/** The fake provider listens on loopback, which only an app admin may point at. */
const LOCAL = { allowPrivate: true }

/** A provider in one process: 403s for the `locked` bucket, hangs for `silent`, else stores. */
const objects = new Map<string, Uint8Array>()
const provider = Bun.serve({
  port: 0,
  async fetch(request) {
    const path = new URL(request.url).pathname
    if (path.startsWith('/locked/')) {
      return new Response(
        '<?xml version="1.0"?><Error><Code>AccessDenied</Code><Message>Access Denied</Message></Error>',
        { status: 403, headers: { 'content-type': 'application/xml' } },
      )
    }
    if (path.startsWith('/silent/')) return new Promise<Response>(() => {})
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

const config = (bucket: string): StorageConfig => ({
  endpoint: `http://127.0.0.1:${provider.port}`,
  region: 'auto',
  bucket,
  prefix: 'washi',
  accessKeyId: 'AKIAEXAMPLE1234',
  secretAccessKey: 'not-a-real-secret',
})

describe('testing a bucket before it takes uploads', () => {
  test('a bucket that takes, hands back and deletes the file passes, and keeps nothing', async () => {
    expect(await testStorage(config('open'), 'w1', LOCAL)).toEqual({ ok: true })
    expect(objects.size).toBe(0)
  })

  test("a provider's refusal comes back in plain words", async () => {
    const result = await testStorage(config('locked'), 'w1', LOCAL)
    expect(result).toEqual({
      ok: false,
      reason:
        'The bucket turned these keys away. They need to read, write and delete in this bucket.',
    })
  })

  test('an address with nothing behind it says so', async () => {
    const result = await testStorage(
      { ...config('open'), endpoint: 'http://127.0.0.1:1' },
      'w1',
      LOCAL,
    )
    expect(result).toEqual({ ok: false, reason: 'Nothing answered at this address.' })
  })

  test('a provider that never answers times out instead of hanging Settings', async () => {
    const result = await testStorage(config('silent'), 'w1', { ...LOCAL, timeoutMs: 200 })
    expect(result.ok).toBe(false)
    expect(!result.ok && result.reason).toContain('No answer')
  })
})

describe('a private address is the server’s own network', () => {
  test('refused for an owner, before anything is sent', async () => {
    const result = await testStorage(config('open'), 'w1')
    expect(result.ok).toBe(false)
    expect(result.ok ? '' : result.reason).toContain('app admin')
  })
})
