import { STALE_CHUNK_MESSAGES, STALE_RELOAD_KEY, STALE_RELOAD_WINDOW_MS } from './constants'

/** A chunk this page was built with is gone: a rollout replaced the build under it. */
export function isStaleChunkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '')
  return STALE_CHUNK_MESSAGES.some((known) => message.includes(known))
}

/**
 * Reloads unless one already ran inside the window, so it never loops; true when it did. Without
 * a sessionStorage to stamp, it never reloads.
 */
export function reloadForNewBuild(now = Date.now()): boolean {
  try {
    const last = Number(sessionStorage.getItem(STALE_RELOAD_KEY) ?? Number.NaN)
    if (Math.abs(now - last) <= STALE_RELOAD_WINDOW_MS) return false
    sessionStorage.setItem(STALE_RELOAD_KEY, String(now))
  } catch {
    return false
  }
  window.location.reload()
  return true
}
