import { z } from 'zod'
import { readCapped, TsuruError } from './fetch'
import { checkUrl, fetchPolicySchema } from './policy'

export const UNSPLASH_API = 'https://api.unsplash.com'
const API_POLICY = fetchPolicySchema.parse({
  allowedHosts: ['api.unsplash.com'],
  timeoutMs: 10_000,
})
const MAX_RESPONSE_BYTES = 1_048_576
const PER_PAGE = 24
export const UNSPLASH_ID = /^[A-Za-z0-9_-]{1,64}$/

const httpsOn = (host: string) =>
  z.string().refine((raw) => {
    try {
      const url = new URL(raw)
      return url.protocol === 'https:' && url.hostname === host
    } catch {
      return false
    }
  })

const photoSchema = z.object({
  id: z.string().regex(UNSPLASH_ID),
  width: z.number().nullish(),
  height: z.number().nullish(),
  color: z.string().nullish(),
  alt_description: z.string().nullish(),
  description: z.string().nullish(),
  urls: z.object({
    thumb: httpsOn('images.unsplash.com'),
    small: httpsOn('images.unsplash.com'),
    regular: httpsOn('images.unsplash.com'),
    full: httpsOn('images.unsplash.com'),
  }),
  links: z.object({
    html: httpsOn('unsplash.com'),
    download_location: httpsOn('api.unsplash.com'),
  }),
  user: z.object({
    name: z.string().min(1),
    links: z.object({ html: httpsOn('unsplash.com') }),
  }),
})

const searchSchema = z.object({
  total_pages: z.number().int().nonnegative(),
  results: z.array(z.unknown()),
})

/** An Unsplash photo, trimmed to what a picker draws and a cover or figure keeps. */
export interface UnsplashPhoto {
  id: string
  alt: string | null
  color: string | null
  width: number | null
  height: number | null
  urls: { thumb: string; small: string; regular: string; full: string }
  photographer: { name: string; profileUrl: string }
  pageUrl: string
  downloadLocation: string
}

export interface UnsplashSearch {
  photos: UnsplashPhoto[]
  totalPages: number
}

export interface UnsplashCall {
  accessKey: string
  fetchImpl?: typeof fetch
}

export interface UnsplashSearchInput extends UnsplashCall {
  query: string
  page?: number
}

function trimmed(raw: unknown): UnsplashPhoto | null {
  const parsed = photoSchema.safeParse(raw)
  if (!parsed.success) return null
  const photo = parsed.data
  return {
    id: photo.id,
    alt: (photo.alt_description ?? photo.description)?.slice(0, 300) || null,
    color: photo.color && /^#[0-9a-f]{6}$/i.test(photo.color) ? photo.color : null,
    width: photo.width ?? null,
    height: photo.height ?? null,
    urls: photo.urls,
    photographer: { name: photo.user.name.slice(0, 120), profileUrl: photo.user.links.html },
    pageUrl: photo.links.html,
    downloadLocation: photo.links.download_location,
  }
}

/** Only api.unsplash.com, https, the key in its header — never in the URL, never redirected. */
async function call(rawUrl: string, { accessKey, fetchImpl = fetch }: UnsplashCall) {
  const verdict = checkUrl(rawUrl, API_POLICY)
  if (!verdict.ok) throw new TsuruError(verdict.reason)
  const response = await fetchImpl(verdict.url.href, {
    redirect: 'error',
    headers: { authorization: `Client-ID ${accessKey}`, 'accept-version': 'v1' },
    signal: AbortSignal.timeout(API_POLICY.timeoutMs),
  })
  if (response.status === 401 || response.status === 403) {
    throw new TsuruError('Unsplash rejected this Access Key')
  }
  if (response.status === 429) throw new TsuruError('Unsplash’s hourly limit is spent; try later')
  if (!response.ok) throw new TsuruError(`Unsplash responded ${response.status}`)
  const raw = await readCapped(response, MAX_RESPONSE_BYTES)
  try {
    return JSON.parse(raw) as unknown
  } catch {
    throw new TsuruError('Unsplash answered with something other than JSON')
  }
}

/** Landscape photos for a cover or a figure; a result that breaks the shape is dropped, not drawn. */
export async function unsplashSearch(input: UnsplashSearchInput): Promise<UnsplashSearch> {
  const url = new URL('/search/photos', UNSPLASH_API)
  url.searchParams.set('query', input.query)
  url.searchParams.set('page', String(Math.max(1, Math.floor(input.page ?? 1))))
  url.searchParams.set('per_page', String(PER_PAGE))
  url.searchParams.set('content_filter', 'high')
  const parsed = searchSchema.safeParse(await call(url.href, input))
  if (!parsed.success) throw new TsuruError('Unsplash response had an unexpected shape')
  return {
    photos: parsed.data.results.flatMap((raw) => trimmed(raw) ?? []),
    totalPages: parsed.data.total_pages,
  }
}

/** One photo, read again by id: what a page keeps comes from Unsplash, never from the client. */
export async function unsplashPhoto(id: string, options: UnsplashCall): Promise<UnsplashPhoto> {
  if (!UNSPLASH_ID.test(id)) throw new TsuruError('not an Unsplash photo id')
  const photo = trimmed(await call(`${UNSPLASH_API}/photos/${id}`, options))
  if (!photo) throw new TsuruError('Unsplash response had an unexpected shape')
  return photo
}

/** Unsplash counts a photo as used only when its `download_location` is called (API guidelines). */
export async function unsplashDownload(downloadLocation: string, options: UnsplashCall) {
  await call(downloadLocation, options)
}
