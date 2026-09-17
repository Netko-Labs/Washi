import type { ServerMode } from '@washi/trpc'

/**
 * C2: the mode is decided once, here, and asserted before anything listens.
 * Hosted refuses to boot without its secrets rather than starting open — phase 2
 * turns that assertion into a real Better Auth check.
 */
export function assertMode(raw: string | undefined): ServerMode {
  const mode = raw ?? 'embedded'
  if (mode !== 'hosted' && mode !== 'embedded') {
    throw new Error(`WASHI_MODE must be "hosted" or "embedded", got "${mode}"`)
  }
  if (mode === 'hosted' && process.env.WASHI_ALLOW_UNAUTHENTICATED !== 'i-know') {
    throw new Error(
      'hosted mode has no authentication until phase 2. Bind it to localhost only and set ' +
        'WASHI_ALLOW_UNAUTHENTICATED=i-know to acknowledge that, or run embedded mode.',
    )
  }
  return mode
}
