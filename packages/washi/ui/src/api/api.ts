import type { HostOptions, UploadedFile, WashiClient } from './types'

let bound: HostOptions | null = null

/**
 * Each host binds once at boot: its transport (HTTP + socket on the web, mirin IPC on the
 * desktop) and the few words that differ between a computer and a server.
 */
export function bindHost(options: HostOptions): void {
  bound = options
}

function host(): HostOptions {
  if (!bound) throw new Error('@washi/ui: bindHost() must run before the first call')
  return bound
}

/** Where a turn ran, for receipts: "this computer" or "your server". */
export const hostPlace = (): string => host().place

/** Null where the host takes no uploads; the composer hides its file choices then. */
export const hostUploadFile = (): ((file: File) => Promise<UploadedFile>) | null =>
  host().uploadFile ?? null

/** Null where the host stores no files; an icon or cover that names one falls back then. */
export const hostFileUrl = (): ((id: string) => string) | null => bound?.fileUrl ?? null

/**
 * The tRPC client every shared component calls, as `api.sheets.list.query()`.
 * A proxy so the binding can happen after the modules that use it are imported.
 */
export const api = new Proxy({} as WashiClient, {
  get: (_, key) => host().client[key as keyof WashiClient],
})
