import type { Comment, MentionRef } from '@washi/domain'
import type { BodySegment, CommentThread } from './types'

/** First comments in the order they were written, each with its replies. */
export function threadsOf(comments: Comment[]): CommentThread[] {
  const threads = new Map<string, CommentThread>()
  for (const comment of comments) {
    if (comment.threadId === comment.id) threads.set(comment.id, { root: comment, replies: [] })
  }
  for (const comment of comments) {
    if (comment.threadId !== comment.id) threads.get(comment.threadId)?.replies.push(comment)
  }
  return [...threads.values()]
}

/** The body with each `@Name` of a mentioned person picked out, longest names first. */
export function bodySegments(body: string, mentions: MentionRef[]): BodySegment[] {
  const names = [...new Set(mentions.map((mention) => `@${mention.name}`))].sort(
    (a, b) => b.length - a.length,
  )
  if (names.length === 0) return [{ text: body, isMention: false }]
  const pattern = new RegExp(
    `(${names.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
  )
  return body
    .split(pattern)
    .filter(Boolean)
    .map((text) => ({ text, isMention: names.includes(text) }))
}

/** Who a comment's body may name: its mentions, and its author — older comments dropped a self-mention. */
export function mentionedIn(comment: Comment): MentionRef[] {
  return [...comment.mentions, { id: comment.authorId, name: comment.authorName }]
}

/** The `@query` being typed right before the caret, or null when the caret is not in one. */
export function mentionQuery(text: string, caret: number): string | null {
  const match = /(?:^|\s)@([^\s@]{0,40})$/.exec(text.slice(0, caret))
  return match ? (match[1] ?? '') : null
}

/** Who an `@query` could mean: names containing it, at most six. */
export function mentionMatches(members: MentionRef[], query: string): MentionRef[] {
  const needle = query.toLowerCase()
  return members.filter((member) => member.name.toLowerCase().includes(needle)).slice(0, 6)
}

/** The people still named in the text — a mention deleted from the draft is not sent. */
export function keptMentions(text: string, picked: MentionRef[]): MentionRef[] {
  return picked.filter((member) => text.includes(`@${member.name}`))
}
