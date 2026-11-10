import type { Member, Viewer } from '@washi/domain'
import type { FileStore, Workspace } from '@washi/repository'
import type { UploadLender } from './uploads/types'

/** What moved, so open pages refetch: page sources, table data, or both. */
export type McpChange = 'page' | 'data'

/**
 * One request's worth of who and where: an outside agent acting as one member, in one workspace —
 * the default one when a sign-in reaches several (`McpWorkspaces`, D124).
 */
export interface McpSession {
  ws: Workspace
  viewer: Viewer
  /** The member is an owner or an admin of this workspace: they set its agent guide (D135). */
  isSteward: boolean
  /** The member the agent acts for: rows are signed by their id, comments by their name. */
  member: { id: string; name: string }
  listPeople: () => Promise<Member[]>
  changed: (kinds: McpChange[]) => void
  /** The workspace's uploads: with it, `file_upload` lands files an icon or a cover can wear. */
  files?: FileStore
  /** The server's own address, so a write can say where its page opens. */
  baseUrl?: string
  /** The workspace's name, for context_get's first line and the instructions (D135). */
  name?: string
  /** Where a `file_upload_url` ticket's bytes go: with it, uploads skip the agent's context. */
  uploads?: UploadLender
}

/** A workspace an agent may act in, as it is named to the agent. */
export interface McpWorkspace {
  id: string
  name: string
}

/**
 * Every workspace one sign-in reaches (D124): the default first. Each tool then takes a
 * `workspace` (an id or a name) and acts there as the same member; without one, the default.
 */
export interface McpWorkspaces {
  list: McpWorkspace[]
  /** One of them as a session, or null when it is not one of them (or they left it). */
  open(id: string): Promise<McpSession | null>
}
