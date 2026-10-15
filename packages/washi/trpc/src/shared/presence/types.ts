/** Someone on a page right now — a teammate, or Washi while it writes. */
export interface PagePresence {
  id: string
  name: string
  editing: boolean
  agent: boolean
}

export interface PresenceBoard {
  /** Here, until `ttlMs` passes without another touch. */
  touch(workspaceId: string, sheetId: string, person: PagePresence, ttlMs?: number): PagePresence[]
  leave(workspaceId: string, sheetId: string, personId: string): void
  list(workspaceId: string, sheetId: string): PagePresence[]
}
