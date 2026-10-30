import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  createFileStore,
  createWorkspaceRegistry,
  localBlobStore,
  routedBlobStore,
  type Workspace,
} from '@washi/repository'
import {
  AgentHost,
  applyWorkspaceDefaults,
  createStoredKeySource,
  forgetUnenforcedVisibility,
  installFormulaFunctions,
  lendServerPolicy,
  liftLooksIntoSource,
  liftScriptsIntoCode,
  reindexPages,
  watchAutomations,
} from '@washi/service'
import { createEventBus, createPresenceBoard, type ResolvedWorkspace } from '@washi/trpc'
import { watchAgentWrites } from './agent-watch'
import { workspaceBuckets } from './buckets'
import { DEFAULT_WORKSPACE_ID } from './constants'
import type { Runtime, RuntimeOptions } from './types'

/**
 * One AgentHost per workspace, created with it. The host holds a workspace for
 * its whole life, so a turn can never write into a workspace it did not start in.
 */
export function createRuntime(options: RuntimeOptions): Runtime {
  const events = createEventBus()
  const presence = createPresenceBoard((workspaceId, sheetId, people) =>
    events.emit('presenceChanged', { workspaceId, sheetId, people }),
  )
  const pathOf = (id: string) => join(options.dataDir, `${id}.db`)
  const registry = createWorkspaceRegistry(pathOf)
  const blobs =
    options.blobs ?? ((id: string) => localBlobStore(join(options.dataDir, `${id}.files`)))
  const ownBucket = options.workspaceStorage ? workspaceBuckets(options.workspaceStorage) : null
  const blobsOf = (id: string) =>
    ownBucket ? routedBlobStore(() => ownBucket(id), blobs(id)) : blobs(id)
  const hosts = new Map<string, ResolvedWorkspace>()

  const attachHost = (workspace: Workspace): ResolvedWorkspace => {
    // Hosted runs on the organization's own key and nothing else — never a
    // local Claude login, whatever this machine has installed. Embedded leaves
    // the choice to the host: the person's Claude Code, then the env key.
    const stored = options.storedAgentKey
    const packages = options.pagePackages
    if (options.serverPolicy) {
      lendServerPolicy(workspace, options.serverPolicy, packages && (() => packages.ready()))
    }
    const keys =
      options.mode === 'hosted'
        ? createStoredKeySource(async () => (stored ? stored(workspace.id) : null))
        : undefined
    liftLooksIntoSource(workspace)
    forgetUnenforcedVisibility(workspace)
    liftScriptsIntoCode(workspace)
    reindexPages(workspace)
    installFormulaFunctions(workspace)
    const host = new AgentHost(workspace, keys)
    const workspaceId = workspace.id
    // What an automation changed reaches open pages like any other write.
    watchAutomations(workspace, () =>
      events.emit('workspaceChanged', { workspaceId, kind: 'data', id: null }),
    )
    const watch = watchAgentWrites(workspaceId, events, presence)
    host.setEvents({
      update: (sessionId, entry) => {
        watch(entry)
        events.emit('agentUpdate', { workspaceId, sessionId, entry })
      },
      approval: (request) => events.emit('approvalRequested', { ...request, workspaceId }),
      openSheet: (id, sessionId) =>
        events.emit('openSheetRequested', { workspaceId, id, ...(sessionId && { sessionId }) }),
      sessionChanged: (sessionId) => events.emit('sessionChanged', { workspaceId, sessionId }),
    })
    host.setPeople(() => options.control.listMembers(workspaceId))
    host.setSearchKey(() => options.searchKey?.(workspaceId) ?? Promise.resolve(null))
    const files = createFileStore(workspace, blobsOf(workspaceId))
    host.setFiles(files)
    return { workspace, host, files }
  }

  return {
    mode: options.mode,
    events,
    control: options.control,
    presence,
    defaultWorkspaceId: options.defaultWorkspaceId ?? DEFAULT_WORKSPACE_ID,
    pagePackages: options.pagePackages,
    unsplashKey: (workspaceId) => options.unsplashKey?.(workspaceId) ?? Promise.resolve(null),

    resolve(workspaceId) {
      const existing = hosts.get(workspaceId)
      if (existing) return existing
      const isNew = !existsSync(pathOf(workspaceId))
      const workspace = registry.open(workspaceId)
      // Only a file this open created: an existing workspace keeps what its owners chose.
      if (isNew && options.serverPolicy) {
        applyWorkspaceDefaults(workspace, options.serverPolicy().defaults)
      }
      const resolved = attachHost(workspace)
      hosts.set(workspaceId, resolved)
      return resolved
    },

    close() {
      hosts.clear()
      registry.closeAll()
    },
  }
}
