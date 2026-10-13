import { homedir } from 'node:os'
import { join } from 'node:path'
import {
  createEmbeddedControlPlane,
  createHostedControlPlane,
  ensureControlSchema,
} from '@washi/control'
import { startRoutineClock } from './clock'
import { DEFAULT_WORKSPACE_ID } from './constants'
import { assertHostedSecrets, assertMode } from './mode'
import { createRuntime } from './runtime'
import type { BootedRuntime, RuntimeOptions } from './types'

type Env = Record<string, string | undefined>

function listOf(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

/** C2: mode, secrets and the control plane are settled here, once, before anything serves. */
export async function bootRuntime(env: Env): Promise<BootedRuntime> {
  const mode = assertMode(env.WASHI_MODE)
  const dataDir = env.WASHI_DATA_DIR ?? join(homedir(), '.washi', 'workspaces')
  const trustedOrigins = listOf(env.WASHI_TRUSTED_ORIGINS)
  let options: RuntimeOptions

  if (mode === 'hosted') {
    const { databaseUrl, masterKey } = assertHostedSecrets(env)
    const baseUrl = env.WASHI_BASE_URL ?? 'http://localhost:3000'
    const hosted = createHostedControlPlane({ databaseUrl, masterKey, baseUrl, trustedOrigins })
    await ensureControlSchema(hosted.db)
    options = {
      mode,
      control: hosted,
      dataDir,
      storedAgentKey: (workspaceId) => hosted.agentKey(workspaceId),
    }
  } else {
    const control = createEmbeddedControlPlane({ workspaceId: DEFAULT_WORKSPACE_ID })
    options = { mode, control, dataDir }
  }

  return startRuntime(options, trustedOrigins)
}

export function startRuntime(
  options: RuntimeOptions,
  trustedOrigins: string[] = [],
  routines = true,
): BootedRuntime {
  const runtime = createRuntime(options)
  const stopClock = routines ? startRoutineClock(runtime, options.dataDir) : () => {}
  return {
    runtime,
    dataDir: options.dataDir,
    trustedOrigins,
    async stop() {
      stopClock()
      runtime.close()
      await options.control.close()
    },
  }
}
