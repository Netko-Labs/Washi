import { TsuruError } from './errors'
import { checkUrl, type FetchPolicy, isPrivateAddress } from './policy'
import { pinned, publicAddresses } from './resolve'

export { TsuruError }

/**
 * Policy-gated fetch. Redirects are re-checked hop by hop so an allowed host
 * can't bounce the crane into a private range.
 */
export async function guardedFetch(rawUrl: string, policy: FetchPolicy): Promise<string> {
  const { response } = await guardedResponse(rawUrl, policy, 'text/*, application/json')
  return readCapped(response, policy.maxResponseBytes)
}

/**
 * The first answer that is not a redirect. Each hop is judged by the policy, then its name is
 * resolved and refused if any address it answers is private, and the connection goes to the
 * address checked (`pinned`) — unless the server lifted the private-range guard (D118).
 */
export async function guardedResponse(
  rawUrl: string,
  policy: FetchPolicy,
  accept: string,
  fetcher: typeof fetch = fetch,
): Promise<{ response: Response; url: URL }> {
  let current = rawUrl

  for (let hop = 0; hop < 4; hop++) {
    const verdict = checkUrl(current, policy)
    if (!verdict.ok) throw new TsuruError(verdict.reason, verdict.needsApproval ?? false)
    const target = policy.allowPrivate
      ? { url: verdict.url, init: {} as RequestInit }
      : pinned(verdict.url, await publicAddresses(verdict.url.hostname))

    const response = await fetcher(target.url, {
      ...target.init,
      redirect: 'manual',
      signal: AbortSignal.timeout(policy.timeoutMs),
      headers: { ...(target.init.headers as Record<string, string> | undefined), accept },
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) throw new TsuruError('redirect without location')
      current = new URL(location, verdict.url).toString()
      continue
    }
    if (!response.ok) throw new TsuruError(`upstream responded ${response.status}`)
    return { response, url: verdict.url }
  }

  throw new TsuruError('too many redirects')
}

/** Reads a body in chunks and stops at the cap, so the cap bounds memory and not just the result. */
export async function readCapped(response: Response, maxBytes: number): Promise<string> {
  return new TextDecoder().decode(await readCappedBytes(response, maxBytes))
}

/** A body's bytes, read in chunks up to the cap; past it, a refusal and nothing kept. */
export async function readCappedBytes(response: Response, maxBytes: number): Promise<Uint8Array> {
  const reader = response.body?.getReader()
  if (!reader) return new Uint8Array()
  const chunks: Uint8Array[] = []
  let received = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    received += value.byteLength
    if (received > maxBytes) {
      await reader.cancel()
      throw new TsuruError(`response exceeds ${maxBytes} bytes`)
    }
    chunks.push(value)
  }
  return new Uint8Array(Buffer.concat(chunks))
}

export { checkUrl, isPrivateAddress }
