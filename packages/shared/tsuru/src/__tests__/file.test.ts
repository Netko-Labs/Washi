import { describe, expect, test } from 'bun:test'
import { fetchFile } from '../index'

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4])

/** A host that answers by path: a picture, a redirect, or a big file. */
const host = (async (input: string | URL | Request) => {
  const url = new URL(input instanceof Request ? input.url : String(input))
  if (url.pathname === '/pic.png') {
    return new Response(PNG, { headers: { 'content-type': 'image/png; charset=binary' } })
  }
  if (url.pathname === '/moved') {
    return new Response(null, { status: 302, headers: { location: 'https://elsewhere.test/x' } })
  }
  if (url.pathname === '/inside') {
    return new Response(null, { status: 302, headers: { location: 'https://10.0.0.1/x' } })
  }
  if (url.pathname === '/big') {
    return new Response(new Uint8Array(64), { headers: { 'content-length': '64' } })
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
    await expect(fetchFile('https://cdn.test/moved', options)).rejects.toThrow(/allowlist/)
    await expect(fetchFile('https://cdn.test/inside', options)).rejects.toThrow(/private/)
    await expect(fetchFile('https://cdn.test/big', options)).rejects.toThrow('exceeds 32 bytes')
    await expect(fetchFile('https://cdn.test/gone', options)).rejects.toThrow('404')
  })
})
