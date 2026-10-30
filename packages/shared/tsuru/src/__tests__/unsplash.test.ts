import { describe, expect, test } from 'bun:test'
import { TsuruError, unsplashDownload, unsplashPhoto, unsplashSearch } from '../index'

const photo = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  width: 6000,
  height: 4000,
  color: '#a3b1c2',
  alt_description: 'a fjord at dawn',
  urls: {
    raw: `https://images.unsplash.com/photo-${id}?ixid=raw`,
    full: `https://images.unsplash.com/photo-${id}?q=85`,
    regular: `https://images.unsplash.com/photo-${id}?w=1080`,
    small: `https://images.unsplash.com/photo-${id}?w=400`,
    thumb: `https://images.unsplash.com/photo-${id}?w=200`,
  },
  links: {
    self: `https://api.unsplash.com/photos/${id}`,
    html: `https://unsplash.com/photos/${id}`,
    download: `https://unsplash.com/photos/${id}/download`,
    download_location: `https://api.unsplash.com/photos/${id}/download?ixid=abc`,
  },
  user: { name: 'Ansel Adams', username: 'ansel', links: { html: 'https://unsplash.com/@ansel' } },
  likes: 12,
  ...overrides,
})

function recorder(body: unknown, status = 200) {
  const calls: { url: string; init: RequestInit }[] = []
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    return new Response(JSON.stringify(body), { status })
  }) as unknown as typeof fetch
  return { calls, fetchImpl }
}

describe('unsplash search', () => {
  test('asks api.unsplash.com with the key in its header and trims each photo', async () => {
    const { calls, fetchImpl } = recorder({ total: 2, total_pages: 1, results: [photo('a1')] })
    const found = await unsplashSearch({ query: 'fjord', page: 2, accessKey: 'key-1', fetchImpl })

    const [seen] = calls
    const url = new URL(seen?.url ?? '')
    expect(url.origin).toBe('https://api.unsplash.com')
    expect(url.pathname).toBe('/search/photos')
    expect(url.searchParams.get('query')).toBe('fjord')
    expect(url.searchParams.get('page')).toBe('2')
    expect(seen?.url).not.toContain('key-1')
    expect(new Headers(seen?.init.headers).get('authorization')).toBe('Client-ID key-1')
    expect(seen?.init.redirect).toBe('error')
    expect(found.totalPages).toBe(1)
    expect(found.photos).toEqual([
      {
        id: 'a1',
        alt: 'a fjord at dawn',
        color: '#a3b1c2',
        width: 6000,
        height: 4000,
        urls: {
          full: 'https://images.unsplash.com/photo-a1?q=85',
          regular: 'https://images.unsplash.com/photo-a1?w=1080',
          small: 'https://images.unsplash.com/photo-a1?w=400',
          thumb: 'https://images.unsplash.com/photo-a1?w=200',
        },
        photographer: { name: 'Ansel Adams', profileUrl: 'https://unsplash.com/@ansel' },
        pageUrl: 'https://unsplash.com/photos/a1',
        downloadLocation: 'https://api.unsplash.com/photos/a1/download?ixid=abc',
      },
    ])
  })

  test('a photo hosted anywhere but Unsplash is dropped, not drawn', async () => {
    const elsewhere = photo('b2', {
      urls: { ...photo('b2').urls, regular: 'https://evil.example/x.jpg' },
    })
    const plain = photo('c3', { links: { ...photo('c3').links, html: 'http://unsplash.com/x' } })
    const { fetchImpl } = recorder({ total_pages: 1, results: [elsewhere, plain, photo('d4')] })
    const found = await unsplashSearch({ query: 'x', accessKey: 'k', fetchImpl })
    expect(found.photos.map((each) => each.id)).toEqual(['d4'])
  })

  test('a refused key, a spent hour and a broken shape say so', async () => {
    const run = (body: unknown, status: number) =>
      unsplashSearch({ query: 'x', accessKey: 'k', fetchImpl: recorder(body, status).fetchImpl })
    await expect(run({}, 401)).rejects.toThrow('rejected this Access Key')
    await expect(run({}, 429)).rejects.toThrow('hourly limit')
    await expect(run({ nope: true }, 200)).rejects.toThrow(TsuruError)
  })
})

describe('unsplash photo and download', () => {
  test('a photo is read again by id; an id that is not one never leaves', async () => {
    const { calls, fetchImpl } = recorder(photo('Dwu85P9SOIk'))
    const kept = await unsplashPhoto('Dwu85P9SOIk', { accessKey: 'k', fetchImpl })
    expect(calls[0]?.url).toBe('https://api.unsplash.com/photos/Dwu85P9SOIk')
    expect(kept.photographer.name).toBe('Ansel Adams')
    await expect(unsplashPhoto('../me', { accessKey: 'k', fetchImpl })).rejects.toThrow('not an')
    expect(calls).toHaveLength(1)
  })

  test('the download ping only ever reaches api.unsplash.com over https', async () => {
    const { calls, fetchImpl } = recorder({ url: 'https://images.unsplash.com/x' })
    await unsplashDownload('https://api.unsplash.com/photos/a1/download?ixid=abc', {
      accessKey: 'k',
      fetchImpl,
    })
    expect(new Headers(calls[0]?.init.headers).get('authorization')).toBe('Client-ID k')
    for (const elsewhere of [
      'https://evil.example/photos/a1/download',
      'http://api.unsplash.com/photos/a1/download',
    ]) {
      await expect(unsplashDownload(elsewhere, { accessKey: 'k', fetchImpl })).rejects.toThrow(
        TsuruError,
      )
    }
    expect(calls).toHaveLength(1)
  })
})
