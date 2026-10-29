/**
 * Where Better Auth says to go next when a sign-in or a consent belongs to an agent's OAuth
 * request (D101); null for an ordinary one.
 */
export function continueUrl(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const { url, uri } = data as Record<string, unknown>
  const next = typeof url === 'string' ? url : typeof uri === 'string' ? uri : null
  return next && /^(https?:|\/)/.test(next) ? next : null
}
