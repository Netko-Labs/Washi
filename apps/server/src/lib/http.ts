const ALLOW_HEADERS = 'content-type, authorization, x-washi-workspace, last-event-id'

/**
 * Loopback and the app scheme only. This is not the security boundary — the
 * token is (a browser page on this machine can reach 127.0.0.1 too). It exists
 * so the renderer's own origin is permitted and nothing else is reflected.
 */
export function isAllowedOrigin(origin: string | null, trusted: string[] = []): boolean {
  if (!origin) return true
  if (origin.startsWith('app://')) return true
  if (trusted.includes(origin)) return true
  try {
    const { hostname, protocol } = new URL(origin)
    return protocol === 'http:' && (hostname === '127.0.0.1' || hostname === 'localhost')
  } catch {
    return false
  }
}

export function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin) return {}
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-credentials': 'true',
    vary: 'origin',
  }
}

export function preflight(origin: string | null): Response {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(origin),
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': ALLOW_HEADERS,
      'access-control-max-age': '86400',
    },
  })
}

/**
 * The token rides a header on ordinary calls and `connectionParams` on
 * subscriptions, because EventSource cannot set headers.
 */
export function tokenFrom(request: Request, url: URL): string | null {
  const header = request.headers.get('authorization')
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length)

  const raw = url.searchParams.get('connectionParams')
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const nested = parsed.data as Record<string, unknown> | undefined
    const token = (nested?.token ?? parsed.token) as unknown
    return typeof token === 'string' ? token : null
  } catch {
    return null
  }
}
