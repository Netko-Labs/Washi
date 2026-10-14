import { z } from 'zod'

export const mentionRefSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
})
export type MentionRef = z.infer<typeof mentionRefSchema>

export const commentSchema = z.object({
  id: z.string(),
  sheetId: z.string(),
  threadId: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  body: z.string(),
  mentions: z.array(mentionRefSchema),
  resolved: z.boolean(),
  hlcCreated: z.string(),
})
export type Comment = z.infer<typeof commentSchema>

/** What a person writes; who wrote it comes from the session, never from the request body. */
export const commentWriteSchema = z.object({
  sheetId: z.string().min(1),
  /** A reply names its thread; a new thread leaves it out. */
  threadId: z.string().min(1).optional(),
  body: z.string().trim().min(1).max(4000),
  mentions: z.array(mentionRefSchema).max(20).default([]),
})
export type CommentWrite = z.infer<typeof commentWriteSchema>

export interface CommentAuthor {
  id: string
  name: string
}

/** A mention as it shows in the Inbox. */
export const mentionItemSchema = z.object({
  commentId: z.string(),
  sheetId: z.string(),
  sheetTitle: z.string(),
  authorName: z.string(),
  body: z.string(),
  hlcCreated: z.string(),
  isRead: z.boolean(),
})
export type MentionItem = z.infer<typeof mentionItemSchema>
