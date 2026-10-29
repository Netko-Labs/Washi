import type { BootedRuntime } from '@washi/runtime'
import type { RUNTIME } from './constants'

export type RuntimeHolder = typeof globalThis & { [RUNTIME]?: Promise<BootedRuntime> }
