import { describe, expect, test } from 'bun:test'
import { EXA_SEARCH_URL, exaSearch, TsuruError } from '../index'

const reply = (status: number, body: unknown) =>
  (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch

describe('exa search', () => {
  test('posts the query with the key and trims each result', async () => {
    const calls: { url: string; init: RequestInit }[] = []
    const fetchImpl = (async (url: string, init: RequestInit) => {
      calls.push({ url, init })
      return new Response(
        JSON.stringify({
          results: [
            { title: 'Loro 1.0', url: 'https://loro.dev/blog/1', text: 'x'.repeat(5_000) },
            { url: 'https://example.com', publishedDate: '2026-01-02' },
          ],
          requestId: 'r1',
        }),
      )
    }) as unknown as typeof fetch

    const results = await exaSearch({ query: 'loro 1.0', count: 2, apiKey: 'k', fetchImpl })
    const [seen] = calls
    expect(seen?.url).toBe(EXA_SEARCH_URL)
    expect(new Headers(seen?.init.headers).get('x-api-key')).toBe('k')
    expect(JSON.parse(String(seen?.init.body)).numResults).toBe(2)
    expect(results).toHaveLength(2)
    expect(results[0]?.text?.length).toBe(1_500)
    expect(results[1]).toEqual({
      title: null,
      url: 'https://example.com',
      publishedDate: '2026-01-02',
      author: null,
      text: null,
    })
  })

  test('a bad key and a broken shape fail loudly', async () => {
    await expect(exaSearch({ query: 'x', apiKey: 'k', fetchImpl: reply(401, {}) })).rejects.toThrow(
      TsuruError,
    )
    await expect(
      exaSearch({ query: 'x', apiKey: 'k', fetchImpl: reply(200, { nope: true }) }),
    ).rejects.toThrow('unexpected shape')
  })
})
