import { join } from 'node:path'
import { createWorkspaceRegistry, type Workspace } from '@washi/repository'
import { AgentHost, createStoredKeySource } from '@washi/service'
import { createEventBus, type ResolvedWorkspace, type ServerRuntime } from '@washi/trpc'
import { DEFAULT_WORKSPACE_ID } from './constants'
import type { ServerOptions } from './types'

/**
 * One AgentHost per workspace, created with it. The host holds a workspace for
 * its whole life, so a turn can never write into a workspace it did not start in.
 */
export function createRuntime(options: ServerOptions): ServerRuntime & { close(): void } {
  const events = createEventBus()
  const registry = createWorkspaceRegistry((id) => join(options.dataDir, `${id}.db`))
  const hosts = new Map<string, ResolvedWorkspace>()

  const attachHost = (workspace: Workspace): ResolvedWorkspace => {
    // Hosted runs on the organization's own key and nothing else — never a
    // local Claude login, whatever this machine has installed. Embedded leaves
    // the choice to the host: the person's Claude Code, then the env key.
    const stored = options.storedAgentKey
    const keys =
      options.mode === 'hosted'
        ? createStoredKeySource(async () => (stored ? stored(workspace.id) : null))
        : undefined
    const host = new AgentHost(workspace, keys)
    const workspaceId = workspace.id
    host.setEvents({
      update: (sessionId, entry) => events.emit('agentUpdate', { workspaceId, sessionId, entry }),
      approval: (request) => events.emit('approvalRequested', { ...request, workspaceId }),
      openSheet: (id) => events.emit('openSheetRequested', { workspaceId, id }),
    })
    return { workspace, host }
  }

  return {
    mode: options.mode,
    events,
    control: options.control,
    defaultWorkspaceId: options.defaultWorkspaceId ?? DEFAULT_WORKSPACE_ID,

    resolve(workspaceId) {
      const existing = hosts.get(workspaceId)
      if (existing) return existing
      const resolved = attachHost(registry.open(workspaceId))
      hosts.set(workspaceId, resolved)
      return resolved
    },

    close() {
      hosts.clear()
      registry.closeAll()
    },
  }
}
