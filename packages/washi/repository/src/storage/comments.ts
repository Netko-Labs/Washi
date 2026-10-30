import type { Comment, CommentAuthor, CommentWrite, MentionItem } from '@washi/domain'
import { commentTable } from '@washi/domain/db'
import { asc, eq } from 'drizzle-orm'
import { newId, type Workspace } from './client'
import { appendOp } from './oplog'

export function listComments(ws: Workspace, sheetId: string): Comment[] {
  return ws.db
    .select()
    .from(commentTable)
    .where(eq(commentTable.sheetId, sheetId))
    .orderBy(asc(commentTable.hlcCreated))
    .all()
}

/** The comment and an unread Inbox row for each person in `notify`; the caller picks them. */
export function createComment(
  ws: Workspace,
  write: CommentWrite,
  author: CommentAuthor,
  notify: string[],
): Comment {
  const id = newId()
  const row = {
    id,
    sheetId: write.sheetId,
    threadId: write.threadId ?? id,
    authorId: author.id,
    authorName: author.name,
    body: write.body,
    mentions: write.mentions,
    resolved: false,
    hlcCreated: ws.now(),
  }
  ws.sqlite.transaction(() => {
    ws.db.insert(commentTable).values(row).run()
    const inbox = ws.sqlite.query(
      'INSERT OR IGNORE INTO mention_inbox (user_id, comment_id, sheet_id) VALUES (?, ?, ?)',
    )
    for (const userId of notify) inbox.run(userId, id, write.sheetId)
    appendOp(ws, 'comment', id, { kind: 'create', ...row })
  })()
  return row
}

export function getComment(ws: Workspace, id: string): Comment | null {
  const [row] = ws.db.select().from(commentTable).where(eq(commentTable.id, id)).all()
  return row ?? null
}

export function setThreadResolved(ws: Workspace, threadId: string, resolved: boolean): boolean {
  const result = ws.sqlite
    .query('UPDATE comments SET resolved = ? WHERE id = ? AND thread_id = id')
    .run(resolved ? 1 : 0, threadId)
  if (result.changes === 0) return false
  appendOp(ws, 'comment', threadId, { kind: resolved ? 'resolve' : 'reopen' })
  return true
}

/** A first comment takes its replies with it; a reply goes alone. */
export function deleteComment(ws: Workspace, id: string): number {
  const ids = (
    ws.sqlite.query('SELECT id FROM comments WHERE id = ? OR thread_id = ?').all(id, id) as {
      id: string
    }[]
  ).map((row) => row.id)
  ws.sqlite.transaction(() => {
    for (const each of ids) {
      ws.sqlite.query('DELETE FROM mention_inbox WHERE comment_id = ?').run(each)
      ws.sqlite.query('DELETE FROM comments WHERE id = ?').run(each)
      appendOp(ws, 'comment', each, { kind: 'delete' })
    }
  })()
  return ids.length
}

/** A page's discussion leaves with the page when it is deleted for good. */
export function deleteSheetComments(ws: Workspace, sheetId: string): void {
  ws.sqlite.query('DELETE FROM mention_inbox WHERE sheet_id = ?').run(sheetId)
  ws.sqlite.query('DELETE FROM comments WHERE sheet_id = ?').run(sheetId)
}

/** A person's mentions, newest first; pages in the Trash keep theirs out of sight. */
export function listMentions(ws: Workspace, userId: string, limit = 50): MentionItem[] {
  const rows = ws.sqlite
    .query(
      `SELECT c.id AS commentId, c.sheet_id AS sheetId, s.title AS sheetTitle,
         c.author_name AS authorName, c.body, c.hlc_created AS hlcCreated, m.read_at AS readAt
       FROM mention_inbox m
       JOIN comments c ON c.id = m.comment_id
       JOIN sheets s ON s.id = m.sheet_id AND s.deleted_at IS NULL
       WHERE m.user_id = ?
       ORDER BY c.hlc_created DESC LIMIT ?`,
    )
    .all(userId, limit) as (Omit<MentionItem, 'isRead'> & { readAt: string | null })[]
  return rows.map(({ readAt, ...item }) => ({ ...item, isRead: readAt !== null }))
}

export function countUnreadMentions(ws: Workspace, userId: string): number {
  const row = ws.sqlite
    .query(
      `SELECT COUNT(*) AS n FROM mention_inbox m
       JOIN sheets s ON s.id = m.sheet_id AND s.deleted_at IS NULL
       WHERE m.user_id = ? AND m.read_at IS NULL`,
    )
    .get(userId) as { n: number }
  return row.n
}

/** Marks the given mentions read, or every one on a page when only the page is named. */
export function markMentionsRead(
  ws: Workspace,
  userId: string,
  target: { commentIds?: string[]; sheetId?: string },
): void {
  const stamp = ws.now()
  if (target.sheetId) {
    ws.sqlite
      .query(
        'UPDATE mention_inbox SET read_at = ? WHERE user_id = ? AND sheet_id = ? AND read_at IS NULL',
      )
      .run(stamp, userId, target.sheetId)
  }
  const mark = ws.sqlite.query(
    'UPDATE mention_inbox SET read_at = ? WHERE user_id = ? AND comment_id = ? AND read_at IS NULL',
  )
  for (const id of target.commentIds ?? []) mark.run(stamp, userId, id)
}
