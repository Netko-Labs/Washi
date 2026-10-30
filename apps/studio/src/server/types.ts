import type { BootedRuntime } from '@washi/runtime'
import type { RUNTIME } from './constants'

export type RuntimeHolder = typeof globalThis & { [RUNTIME]?: Promise<BootedRuntime> }

/** Why an upload is refused, and the status that says so. */
export interface FileRefusal {
  error: string
  status: 400 | 413 | 415
}

/** Nitro route rules by pattern, headers only. */
export type HeaderRules = Record<string, { headers: Record<string, string> }>
