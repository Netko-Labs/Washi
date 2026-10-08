import { readdirSync } from 'node:fs'
import type { ServerRuntime } from '@washi/trpc'
import { ROUTINE_TICK_MS } from './constants'

/** Every workspace this server holds, opened or not — a routine must not wait for a visitor. */
export function workspaceIds(dataDir: string, fallback: string): string[] {
  try {
    const ids = readdirSync(dataDir)
      .filter((file) => file.endsWith('.db'))
      .map((file) => file.slice(0, -'.db'.length))
    return ids.includes(fallback) ? ids : [...ids, fallback]
  } catch {
    return [fallback]
  }
}

/**
 * The only caller of routines. A tick never throws: one broken workspace must not
 * stop every other workspace's morning.
 */
export function startRoutineClock(runtime: ServerRuntime, dataDir: string): () => void {
  const tick = () => {
    for (const id of workspaceIds(dataDir, runtime.defaultWorkspaceId)) {
      try {
        runtime.resolve(id).host.routines.tick()
      } catch (error) {
        console.error(`[washi] routines in workspace ${id} failed to tick`, error)
      }
    }
  }
  const timer = setInterval(tick, ROUTINE_TICK_MS)
  return () => clearInterval(timer)
}
