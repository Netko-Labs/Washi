import { type BootedRuntime, bootRuntime } from '@washi/runtime'
import { contextFromRequest, type EdgeLogger } from '@washi/trpc'

const RUNTIME = Symbol.for('washi.studio.runtime')
type Holder = typeof globalThis & { [RUNTIME]?: Promise<BootedRuntime> }

/**
 * One runtime per process, shared by the Nitro plugin, the routes and the socket — they are
 * separate modules, and dev reloads them. A studio is a team server: hosted unless told otherwise.
 */
export function washiRuntime(): Promise<BootedRuntime> {
  const holder = globalThis as Holder
  holder[RUNTIME] ??= bootRuntime({
    ...process.env,
    WASHI_MODE: process.env.WASHI_MODE ?? 'hosted',
  })
  return holder[RUNTIME]
}

/** Origins allowed to call the API with the session cookie: this server, plus any extras. */
export function trustedOrigins(): string[] {
  const extra = (process.env.WASHI_TRUSTED_ORIGINS ?? '').split(',').map((o) => o.trim())
  return [process.env.WASHI_BASE_URL ?? 'http://localhost:3000', ...extra].filter(Boolean)
}

export async function createRequestContext(
  opts: Parameters<ReturnType<typeof contextFromRequest>>[0],
) {
  const { runtime } = await washiRuntime()
  return contextFromRequest(runtime)(opts)
}

/** The edges log `(fields, message)`; console reads better message first. */
export const edgeLogger: EdgeLogger = {
  info: (fields, message) => console.log(`[washi] ${message}`, fields),
  warn: (fields, message) => console.warn(`[washi] ${message}`, fields),
}
