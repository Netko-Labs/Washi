import { guardedResponse, readCappedBytes, TsuruError } from './fetch'
import { fetchPolicySchema } from './policy'
import type { FetchedFile, FileFetchOptions } from './types'

/** The address's last segment as a file's name: decoded, and only what follows its last / or \. */
const nameOf = (url: URL): string | null => {
  let last: string
  try {
    last = (
      decodeURIComponent(url.pathname.split('/').pop() ?? '')
        .split(/[\\/]/)
        .pop() ?? ''
    ).trim()
  } catch {
    return null
  }
  return last && last !== '.' && last !== '..' ? last : null
}

/**
 * One file fetched because a person's agent asked for exactly it: that host alone is allowed (a
 * redirect elsewhere is refused), still https only, no private ranges unless the server lifted that
 * guard, and the body capped — an oversized `content-length` is refused before a byte is read.
 */
export async function fetchFile(href: string, options: FileFetchOptions): Promise<FetchedFile> {
  let host: string
  try {
    host = new URL(href).hostname
  } catch {
    throw new TsuruError('invalid URL')
  }
  const policy = fetchPolicySchema.parse({
    allowedHosts: [host],
    allowPrivate: options.allowPrivate ?? false,
    maxResponseBytes: options.maxBytes,
    timeoutMs: options.timeoutMs ?? 30_000,
  })
  const { response, url } = await guardedResponse(href, policy, '*/*', options.fetcher)
  const declared = Number(response.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > options.maxBytes) {
    await response.body?.cancel()
    throw new TsuruError(`response exceeds ${options.maxBytes} bytes`)
  }
  const bytes = await readCappedBytes(response, options.maxBytes)
  const type = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
  return { bytes, contentType: type || null, url: url.href, filename: nameOf(url) }
}
