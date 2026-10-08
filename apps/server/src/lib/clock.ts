import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { ServerRuntime } from '@washi/trpc'
import { ROUTINE_TICK_MS } from './constants'

/**
 * Workspaces the control plane says exist *and* that have a file. A deleted
 * organization's leftover file, a stray .db, or an id with no file yet is never
 * opened — opening creates.
 */
export async function liveWorkspaceIds(
  runtime: Pick<ServerRuntime, 'control'>,
  dataDir: string,
): Promise<string[]> {
  const ids = await runtime.control.workspaceIds()
  return ids.filter((id) => existsSync(join(dataDir, `${id}.db`)))
}

/**
 * The only caller of routines. A tick never throws: one broken workspace must not
 * stop every other workspace's morning.
 */
export function startRoutineClock(runtime: ServerRuntime, dataDir: string): () => void {
  let ticking = false
  const tick = async () => {
    if (ticking) return
    ticking = true
    try {
      for (const id of await liveWorkspaceIds(runtime, dataDir)) {
        try {
          runtime.resolve(id).host.routines.tick()
        } catch (error) {
          console.error(`[washi] routines in workspace ${id} failed to tick`, error)
        }
      }
    } catch (error) {
      console.error('[washi] the routine clock could not list workspaces', error)
    } finally {
      ticking = false
    }
  }
  const timer = setInterval(() => void tick(), ROUTINE_TICK_MS)
  return () => clearInterval(timer)
}
