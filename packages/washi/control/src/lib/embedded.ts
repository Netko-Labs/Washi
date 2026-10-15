import type { ControlPlane } from '@washi/trpc'

export interface EmbeddedControlPlaneOptions {
  workspaceId: string
  workspaceName?: string
}

/**
 * No accounts, no network, nobody to authenticate: one person is at the machine
 * and the workspace is the file in front of them. Everything hosted mode does
 * with Postgres, this answers with a constant — which is the entire content of
 * phase 7, and only because C1 and C3 held.
 */
export function createEmbeddedControlPlane(options: EmbeddedControlPlaneOptions): ControlPlane {
  const { workspaceId, workspaceName = 'Personal workspace' } = options

  return {
    async authenticate() {
      return null
    },
    async authorize(_actorId, requested) {
      return requested === workspaceId
    },
    async listWorkspaces() {
      return [{ id: workspaceId, name: workspaceName, role: 'owner' }]
    },
    async listMembers() {
      return [{ id: 'local', name: 'You' }]
    },
    async workspaceIds() {
      return [workspaceId]
    },
    async handle() {
      return null
    },
    async close() {
      // nothing to close; there is no control plane to speak of
    },
  }
}
