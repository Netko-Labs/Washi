import { getRequestIP } from '@tanstack/react-start/server'

/**
 * Cloudflare's `cf-connecting-ip`, else the right-most X-Forwarded-For hop (the one our own proxy
 * appended; the left ones are the client's to forge), else the socket peer.
 */
export function visitorAddress(headers: Headers, peer?: string | null): string | null {
  const cloudflare = headers.get('cf-connecting-ip')?.trim()
  if (cloudflare) return cloudflare
  const hops = (headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((hop) => hop.trim())
    .filter(Boolean)
  return hops.at(-1) ?? (peer?.trim() || null)
}

function peerAddress(): string | null {
  try {
    return getRequestIP() ?? null
  } catch {
    return null
  }
}

/**
 * The visitor's address, keyed with the server's secret and the workspace, so limits count per
 * address and the address is kept nowhere (D120). No secret, no hash: null, and no suggestion.
 */
export function visitorHash(
  request: Request,
  workspaceId: string,
  secret = process.env.WASHI_SECRET_KEY,
): string | null {
  if (!secret) return null
  const address = visitorAddress(request.headers, peerAddress()) ?? 'unknown'
  return new Bun.CryptoHasher('sha256', secret).update(`${workspaceId}\n${address}`).digest('hex')
}
