import { join } from 'node:path'
import { createWorkspaceRegistry, type Workspace } from '@washi/repository'
import { AgentHost } from '@washi/service'
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
    const host = new AgentHost(workspace)
    host.setEvents({
      update: (sessionId, entry) => events.emit('agentUpdate', { sessionId, entry }),
      approval: (request) => events.emit('approvalRequested', request),
      openSheet: (id) => events.emit('openSheetRequested', { id }),
    })
    return { workspace, host }
  }

  return {
    mode: options.mode,
    events,
    defaultWorkspaceId: DEFAULT_WORKSPACE_ID,

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
