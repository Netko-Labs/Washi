import { homedir } from 'node:os'
import { join } from 'node:path'
import {
  createEmbeddedControlPlane,
  createHostedControlPlane,
  ensureControlSchema,
} from '@washi/control'
import { type BlobStoreFactory, s3BlobStores } from '@washi/repository'
import { startRoutineClock } from './clock'
import { DEFAULT_WORKSPACE_ID } from './constants'
import { keyWithFallback, searchKeyWithFallback } from './keys'
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

/** A bucket when `WASHI_FILES_S3_BUCKET` is set; otherwise files sit beside each workspace's .db. */
function s3FromEnv(env: Env): BlobStoreFactory | undefined {
  const bucket = env.WASHI_FILES_S3_BUCKET
  if (!bucket) return undefined
  const accessKeyId = env.WASHI_FILES_S3_ACCESS_KEY_ID
  const secretAccessKey = env.WASHI_FILES_S3_SECRET_ACCESS_KEY
  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      'WASHI_FILES_S3_BUCKET needs WASHI_FILES_S3_ACCESS_KEY_ID and WASHI_FILES_S3_SECRET_ACCESS_KEY',
    )
  }
  return s3BlobStores({
    bucket,
    accessKeyId,
    secretAccessKey,
    region: env.WASHI_FILES_S3_REGION,
    endpoint: env.WASHI_FILES_S3_ENDPOINT,
    prefix: env.WASHI_FILES_S3_PREFIX,
  })
}

/** C2: mode, secrets and the control plane are settled here, once, before anything serves. */
export async function bootRuntime(env: Env): Promise<BootedRuntime> {
  const mode = assertMode(env.WASHI_MODE)
  const dataDir = env.WASHI_DATA_DIR ?? join(homedir(), '.washi', 'workspaces')
  const trustedOrigins = listOf(env.WASHI_TRUSTED_ORIGINS)
  const blobs = s3FromEnv(env)
  let options: RuntimeOptions

  if (mode === 'hosted') {
    const { databaseUrl, masterKey } = assertHostedSecrets(env)
    const baseUrl = env.WASHI_BASE_URL ?? 'http://localhost:3000'
    const hosted = createHostedControlPlane({ databaseUrl, masterKey, baseUrl, trustedOrigins })
    await ensureControlSchema(hosted.db)
    await hosted.instance.load()
    options = {
      mode,
      control: hosted,
      dataDir,
      storedAgentKey: keyWithFallback(
        (workspaceId) => hosted.agentKey(workspaceId),
        () => hosted.instance.agentKey(),
      ),
      serverPolicy: () => hosted.instance.policy(),
      searchKey: searchKeyWithFallback(
        (workspaceId) => hosted.integrationKey(workspaceId, 'exa'),
        () => hosted.instance.searchKey(),
      ),
      blobs,
      workspaceStorage: (workspaceId) => hosted.storage.config(workspaceId),
    }
  } else {
    const control = createEmbeddedControlPlane({ workspaceId: DEFAULT_WORKSPACE_ID })
    options = { mode, control, dataDir, searchKey: async () => env.EXA_API_KEY ?? null, blobs }
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
    stopClock,
    async stop() {
      stopClock()
      runtime.close()
      await options.control.close()
    },
  }
}
