import { homedir } from 'node:os'
import { join } from 'node:path'
import {
  createEmbeddedControlPlane,
  createHostedControlPlane,
  ensureControlSchema,
} from '@washi/control'
import type { AgentCredential } from '@washi/service'
import type { ControlPlane } from '@washi/trpc'
import { startServer } from './index'
import { DEFAULT_WORKSPACE_ID } from './lib/constants'
import { assertHostedSecrets, assertMode } from './lib/mode'

const mode = assertMode(process.env.WASHI_MODE)
const dataDir = process.env.WASHI_DATA_DIR ?? join(homedir(), '.washi', 'workspaces')
const baseUrl = process.env.WASHI_BASE_URL ?? 'http://localhost:3000'
const trustedOrigins = (process.env.WASHI_TRUSTED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

let control: ControlPlane
let resolveAgentKey: ((workspaceId: string) => Promise<AgentCredential | null>) | undefined

if (mode === 'hosted') {
  const { databaseUrl, masterKey } = assertHostedSecrets(process.env)
  const hosted = createHostedControlPlane({ databaseUrl, masterKey, baseUrl, trustedOrigins })
  await ensureControlSchema(hosted.db)
  control = hosted
  resolveAgentKey = async (workspaceId) => {
    const stored = await hosted.agentKey(workspaceId)
    if (!stored) return null
    return {
      apiKey: stored.apiKey,
      provider: stored.provider === 'openrouter' ? 'openrouter' : 'anthropic',
      model: stored.model ?? undefined,
    }
  }
} else {
  control = createEmbeddedControlPlane({ workspaceId: DEFAULT_WORKSPACE_ID })
}

const server = startServer({
  mode,
  control,
  resolveAgentKey,
  dataDir,
  trustedOrigins,
  hostname: process.env.WASHI_HOSTNAME,
  port: process.env.WASHI_PORT ? Number(process.env.WASHI_PORT) : undefined,
})

console.log(`[washi] ${server.mode} server on ${server.url} — workspaces in ${dataDir}`)

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void server.stop().then(() => process.exit(0))
  })
}
