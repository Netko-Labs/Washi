import { z } from 'zod'
import { readCapped, TsuruError } from './fetch'

export const EXA_SEARCH_URL = 'https://api.exa.ai/search'
const RESULT_TEXT_CHARS = 1_500
const MAX_RESPONSE_BYTES = 1_048_576

export const exaResultSchema = z.object({
  title: z.string().nullish(),
  url: z.string(),
  publishedDate: z.string().nullish(),
  author: z.string().nullish(),
  text: z.string().nullish(),
})
export type ExaResult = z.infer<typeof exaResultSchema>

const responseSchema = z.object({ results: z.array(exaResultSchema) })

export interface ExaSearchInput {
  query: string
  count?: number
  apiKey: string
  timeoutMs?: number
  fetchImpl?: typeof fetch
}

/** Exa's search, trimmed to what a turn can use: title, url, date, and a short text. */
export async function exaSearch(input: ExaSearchInput): Promise<ExaResult[]> {
  const { query, count = 5, apiKey, timeoutMs = 15_000, fetchImpl = fetch } = input
  const response = await fetchImpl(EXA_SEARCH_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({
      query,
      numResults: Math.min(Math.max(count, 1), 10),
      type: 'auto',
      contents: { text: { maxCharacters: RESULT_TEXT_CHARS } },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (response.status === 401 || response.status === 403) {
    throw new TsuruError('Exa rejected this API key')
  }
  if (!response.ok) throw new TsuruError(`Exa responded ${response.status}`)
  const raw = await readCapped(response, MAX_RESPONSE_BYTES)
  const parsed = responseSchema.safeParse(JSON.parse(raw))
  if (!parsed.success) throw new TsuruError('Exa response had an unexpected shape')
  return parsed.data.results.map((result) => ({
    title: result.title ?? null,
    url: result.url,
    publishedDate: result.publishedDate ?? null,
    author: result.author ?? null,
    text: result.text?.slice(0, RESULT_TEXT_CHARS) ?? null,
  }))
}
