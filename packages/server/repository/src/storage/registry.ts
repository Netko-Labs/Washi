import { openWorkspace, type Workspace } from './client'

export interface WorkspaceRegistry {
  open(id: string): Workspace
  close(id: string): void
  closeAll(): void
}

/**
 * Opens workspaces on demand and keeps them open. `resolvePath` is the only
 * thing that differs between deployment modes: embedded points every id at one
 * local file, hosted looks the id up in the control plane.
 */
export function createWorkspaceRegistry(resolvePath: (id: string) => string): WorkspaceRegistry {
  const open = new Map<string, Workspace>()

  return {
    open(id) {
      const existing = open.get(id)
      if (existing) return existing
      const workspace = openWorkspace({ id, path: resolvePath(id) })
      open.set(id, workspace)
      return workspace
    },
    close(id) {
      open.get(id)?.close()
      open.delete(id)
    },
    closeAll() {
      for (const workspace of open.values()) workspace.close()
      open.clear()
    },
  }
}
