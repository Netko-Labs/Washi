import type { ChatMove, Handoff, Viewer } from '@washi/domain'
import {
  getSession,
  getSheet,
  latestMoveFrom,
  setSessionAnchor,
  type Workspace,
} from '@washi/repository'
import { readableSet, SheetNotFoundError } from '../sheets/access'

/** Said as NOT_FOUND: a chat that is not yours is not there (D67). */
export class ChatMoveError extends Error {
  constructor(sessionId: string) {
    super(`no chat ${sessionId}`)
    this.name = 'ChatMoveError'
  }
}

/**
 * Re-anchors a chat to a page its starter can read, or to Home (`null`) — D110. A workspace's chat
 * (a routine's) belongs to nobody, so nobody moves it. Already there is no move: null, no marker.
 */
export function moveChat(
  ws: Workspace,
  sessionId: string,
  sheetId: string | null,
  viewer: Viewer,
  by: Handoff['by'],
  note?: string,
): Handoff | null {
  const session = getSession(ws, sessionId)
  if (!session || session.createdBy === null || session.createdBy !== viewer.id) {
    throw new ChatMoveError(sessionId)
  }
  const sheet = sheetId === null ? null : getSheet(ws, sheetId)
  if (sheetId !== null && (!sheet || !readableSet(ws, viewer).has(sheetId))) {
    throw new SheetNotFoundError(sheetId)
  }
  const from = session.anchor?.sheetId ?? null
  if (from === sheetId) return null
  setSessionAnchor(ws, sessionId, sheetId === null ? null : { sheetId, scope: 'page' })
  return {
    kind: 'handoff',
    from,
    to: sheetId,
    title: sheet?.title ?? 'Home',
    by,
    ...(note?.trim() && { note: note.trim().slice(0, 280) }),
  }
}

/** What a page's empty panel says about the chat that left it, if one did and is still away. */
export function movedFrom(ws: Workspace, sheetId: string, viewer: Viewer): ChatMove | null {
  return viewer.id === null ? null : latestMoveFrom(ws, sheetId, viewer.id)
}
