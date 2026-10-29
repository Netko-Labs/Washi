import type { Member, Viewer } from '@washi/domain'
import type { Workspace } from '@washi/repository'

/** What moved, so open pages refetch: page sources, table data, or both. */
export type McpChange = 'page' | 'data'

/** One request's worth of who and where: an outside agent acting as one member, in one workspace. */
export interface McpSession {
  ws: Workspace
  viewer: Viewer
  /** The member the agent acts for: rows are signed by their id, comments by their name. */
  member: { id: string; name: string }
  listPeople: () => Promise<Member[]>
  changed: (kinds: McpChange[]) => void
}
