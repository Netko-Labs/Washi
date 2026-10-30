import { RETURN_BASE } from './constants'

/**
 * A path on this site, or null. Resolved the way a browser reads it, so `/\host`, `//host`, a tab
 * or newline inside, or another scheme cannot leave the origin.
 */
export function sameOriginPath(target: unknown, origin: string = RETURN_BASE): string | null {
  if (typeof target !== 'string' || target === '') return null
  let url: URL
  try {
    url = new URL(target, origin)
  } catch {
    return null
  }
  return url.origin === origin ? `${url.pathname}${url.search}${url.hash}` : null
}
