import { processSingleton } from '@washi/domain'

// Set in the Nitro plugin, read by the health route: two bundles, one process.
const shutdown = () => processSingleton('studio-draining', () => ({ isDraining: false }))

export function startDraining(): void {
  shutdown().isDraining = true
}

export function isDraining(): boolean {
  return shutdown().isDraining
}
