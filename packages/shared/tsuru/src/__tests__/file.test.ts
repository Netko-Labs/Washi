import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { fetchFile, pinned, publicAddresses, setAddressLookup } from '../index'

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4])

/** What each test name answers: a public host, one that answers inside too, and one inside only. */
const ANSWERS: Record<string, string[]> = {
  'cdn.test': ['93.184.216.34', '2606:2800:220:1::1'],
  'mixed.test': ['93.184.216.34', '10.0.0.7'],
  'rebound.test': ['::ffff:7f00:1'],
}

beforeAll(() =>
  setAddressLookup(async (host) => {
    const found = ANSWERS[host]
    if (!found) throw new Error('ENOTFOUND')
    return found.map((address) => ({ address, family: address.includes(':') ? 6 : 4 }))
  }),
)
afterAll(() => setAddressLookup(null))

/** A host that answers by path: a picture, redirects, or a big file. */
const host = (async (input: string | URL | Request) => {
  const url = new URL(input instanceof Request ? input.url : String(input))
  const moved = (location: string) => new Response(null, { status: 302, headers: { location } })
  if (url.pathname === '/pic.png') {
    return new Response(PNG, { headers: { 'content-type': 'image/png; charset=binary' } })
  }
  if (url.pathname === '/moved') return moved('https://elsewhere.test/x')
  if (url.pathname === '/inside') return moved('https://10.0.0.1/x')
  if (url.pathname === '/big') {
    return new Response(new Uint8Array(64), { headers: { 'content-length': '64' } })
  }
  if (url.pathname === '/chunked') {
    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(40))
          controller.close()
        },
      }),
    )
  }
  return new Response('nope', { status: 404 })
}) as typeof fetch

describe('fetching one file (file_upload_from)', () => {
  test('answers the bytes, the bare type and the name off the path', async () => {
    const got = await fetchFile('https://cdn.test/pic.png', { maxBytes: 1024, fetcher: host })
    expect(got).toEqual({
      bytes: PNG,
      contentType: 'image/png',
      url: 'https://cdn.test/pic.png',
      filename: 'pic.png',
    })
  })

  test('keeps tsuru’s refusals: http, private ranges, another host, past the cap', async () => {
    const options = { maxBytes: 32, fetcher: host }
    await expect(fetchFile('http://cdn.test/pic.png', options)).rejects.toThrow('https only')
    await expect(fetchFile('https://192.168.1.4/pic.png', options)).rejects.toThrow(/private/)
    await expect(fetchFile('https://[::ffff:7f00:1]/pic.png', options)).rejects.toThrow(/private/)
    await expect(fetchFile('https://cdn.test/moved', options)).rejects.toThrow(/allowlist/)
    await expect(fetchFile('https://cdn.test/inside', options)).rejects.toThrow(/private/)
    await expect(fetchFile('https://cdn.test/big', options)).rejects.toThrow('exceeds 32 bytes')
    await expect(fetchFile('https://cdn.test/chunked', options)).rejects.toThrow('exceeds 32')
    await expect(fetchFile('https://cdn.test/gone', options)).rejects.toThrow('404')
  })

  test('a name is resolved and refused if any address it answers is inside (D135)', async () => {
    const options = { maxBytes: 1024, fetcher: host }
    await expect(fetchFile('https://mixed.test/pic.png', options)).rejects.toThrow(
      '"mixed.test" resolves to a private address (10.0.0.7)',
    )
    await expect(fetchFile('https://rebound.test/pic.png', options)).rejects.toThrow(/private/)
    await expect(fetchFile('https://nowhere.test/pic.png', options)).rejects.toThrow(
      'does not resolve',
    )
    // The server's admin lifted the guard (D118): no lookup refuses it.
    const lifted = await fetchFile('https://rebound.test/pic.png', {
      ...options,
      allowPrivate: true,
    })
    expect(lifted.bytes).toEqual(PNG)
    expect(await publicAddresses('cdn.test')).toHaveLength(2)
  })

  test('the connection goes to the address checked; TLS and Host keep the name', () => {
    setAddressLookup(null)
    try {
      const out = pinned(new URL('https://cdn.test/a?b=1'), [
        { address: '2606:2800:220:1::1', family: 6 },
      ])
      expect(out.url.href).toBe('https://[2606:2800:220:1::1]/a?b=1')
      const init = out.init as RequestInit & {
        tls: { serverName: string; checkServerIdentity: unknown }
      }
      expect(init.headers).toEqual({ host: 'cdn.test' })
      expect(init.tls.serverName).toBe('cdn.test')
      expect(typeof init.tls.checkServerIdentity).toBe('function')
      // A literal is already the address.
      expect(pinned(new URL('https://8.8.8.8/'), [{ address: '8.8.8.8', family: 4 }]).init).toEqual(
        {},
      )
    } finally {
      setAddressLookup(async (name) =>
        (ANSWERS[name] ?? []).map((address) => ({
          address,
          family: address.includes(':') ? 6 : 4,
        })),
      )
    }
  })
})
