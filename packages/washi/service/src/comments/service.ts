import type { Comment, CommentAuthor, CommentWrite } from '@washi/domain'
import {
  createComment,
  deleteComment,
  getComment,
  setThreadResolved,
  type Workspace,
} from '@washi/repository'
import { requireSheet } from '../sheets/service'

export class CommentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CommentError'
  }
}

/**
 * A reply stays on its thread's page. Every mention is kept, so the body draws it; nobody is
 * notified of their own, or twice.
 */
export function postComment(ws: Workspace, write: CommentWrite, author: CommentAuthor): Comment {
  requireSheet(ws, write.sheetId)
  if (write.threadId) {
    const thread = getComment(ws, write.threadId)
    if (!thread || thread.threadId !== thread.id || thread.sheetId !== write.sheetId) {
      throw new CommentError('that thread is not on this page')
    }
  }
  const seen = new Set<string>()
  const mentions = write.mentions.filter((mention) => {
    if (seen.has(mention.id)) return false
    seen.add(mention.id)
    return true
  })
  const notify = mentions.map((mention) => mention.id).filter((id) => id !== author.id)
  return createComment(ws, { ...write, mentions }, author, notify)
}

export function resolveThread(ws: Workspace, threadId: string, resolved: boolean): void {
  if (!setThreadResolved(ws, threadId, resolved)) throw new CommentError('no such thread')
}

/** Only its author deletes a comment; deleting a thread's first comment deletes the thread. */
export function removeComment(ws: Workspace, id: string, authorId: string): void {
  const comment = getComment(ws, id)
  if (!comment) throw new CommentError('no such comment')
  if (comment.authorId !== authorId) {
    throw new CommentError('only the person who wrote a comment can delete it')
  }
  deleteComment(ws, id)
}
