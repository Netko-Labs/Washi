import { checkUrl, type FetchPolicy, isPrivateAddress } from './policy'

export class TsuruError extends Error {
  readonly needsApproval: boolean

  constructor(message: string, needsApproval = false) {
    super(message)
    this.name = 'TsuruError'
    this.needsApproval = needsApproval
  }
}

/**
 * Policy-gated fetch. Redirects are re-checked hop by hop so an allowed host
 * can't bounce the crane into a private range.
 */
export async function guardedFetch(rawUrl: string, policy: FetchPolicy): Promise<string> {
  let current = rawUrl

  for (let hop = 0; hop < 4; hop++) {
    const verdict = checkUrl(current, policy)
    if (!verdict.ok) throw new TsuruError(verdict.reason, verdict.needsApproval ?? false)

    const response = await fetch(verdict.url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(policy.timeoutMs),
      headers: { accept: 'text/*, application/json' },
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) throw new TsuruError('redirect without location')
      current = new URL(location, verdict.url).toString()
      continue
    }
    if (!response.ok) throw new TsuruError(`upstream responded ${response.status}`)
    return readCapped(response, policy.maxResponseBytes)
  }

  throw new TsuruError('too many redirects')
}

/** Reads a body in chunks and stops at the cap, so the cap bounds memory and not just the result. */
export async function readCapped(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) return ''
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
  return new TextDecoder().decode(Buffer.concat(chunks))
}

export { checkUrl, isPrivateAddress }
