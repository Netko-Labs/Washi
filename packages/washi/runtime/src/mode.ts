import { DATABASE_ENV, SECRET_ENV } from '@washi/control'
import type { ServerMode } from '@washi/trpc'
import { MIN_SECRET_LENGTH } from './constants'
import type { HostedSecrets } from './types'

/**
 * C2: the mode is decided once, here, and asserted before anything listens.
 */
export function assertMode(raw: string | undefined): ServerMode {
  const mode = raw ?? 'embedded'
  if (mode !== 'hosted' && mode !== 'embedded') {
    throw new Error(`WASHI_MODE must be "hosted" or "embedded", got "${mode}"`)
  }
  return mode
}

/**
 * Hosted refuses to boot without its secrets rather than starting open. The
 * master key is not only the session secret — every workspace's BYOK key is
 * derived from it, so a weak one is a weak key store.
 */
export function assertHostedSecrets(env: Record<string, string | undefined>): HostedSecrets {
  const databaseUrl = env[DATABASE_ENV]
  const masterKey = env[SECRET_ENV]

  if (!databaseUrl) throw new Error(`hosted mode needs ${DATABASE_ENV} (a postgres:// url)`)
  if (!masterKey) throw new Error(`hosted mode needs ${SECRET_ENV}`)
  if (masterKey.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `${SECRET_ENV} must be at least ${MIN_SECRET_LENGTH} characters — every workspace's ` +
        'stored API key is derived from it',
    )
  }
  return { databaseUrl, masterKey }
}
