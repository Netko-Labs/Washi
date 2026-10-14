import type { WashiClient } from './types'

let bound: WashiClient | null = null

/** Each host binds its own transport once at boot: HTTP + socket on the web, mirin IPC on desktop. */
export function bindApi(client: WashiClient): void {
  bound = client
}

/**
 * The tRPC client every shared component calls, as `api.sheets.list.query()`.
 * A proxy so the binding can happen after the modules that use it are imported.
 */
export const api = new Proxy({} as WashiClient, {
  get(_, key) {
    if (!bound) throw new Error('@washi/ui: bindApi(client) must run before the first call')
    return bound[key as keyof WashiClient]
  },
})
