import type { FileStore, Workspace } from '@washi/repository'

/** A promise of one upload: who asked, where it lands, and exactly what it will be. */
export interface UploadTicket {
  /** The secret in the URL: whoever holds it may send these bytes, once. */
  token: string
  workspaceId: string
  actorId: string
  /** The id the file will have — its `file:<id>` key is said when the ticket is made. */
  fileId: string
  name: string
  mime: string
  bytes: number
  expiresAt: number
}

/** What a ticket asks for when it is made. */
export type TicketAsk = Omit<UploadTicket, 'token' | 'fileId' | 'expiresAt'>

/**
 * A workspace's files, opened when the bytes arrive — or null when the ticket's member is no longer
 * one of its members (or it is gone): the host checks again, the ticket alone is not enough then.
 */
export type OpenUploads = (
  ticket: Pick<UploadTicket, 'workspaceId' | 'actorId'>,
) =>
  | Promise<{ ws: Workspace; files: FileStore } | null>
  | { ws: Workspace; files: FileStore }
  | null

/** Where the server takes a ticket's bytes: the studio's route, by token. */
export interface UploadLender {
  url(token: string): string
}
