import { mentionRefSchema } from '@washi/domain'
import { listComments, type Workspace } from '@washi/repository'
import { z } from 'zod'
import { pagesFor } from '../agents/lib/pages'
import { postComment } from '../comments/service'
import { openRowPage } from '../tables/rows'
import { capability } from './define'
import type { Capability, CapabilityContext } from './types'

/** A page's discussion, read and joined as the person — or a row's, through its own page. */
export function commentCapabilities(
  ws: Workspace,
  context: CapabilityContext & { authorName: string },
): Capability[] {
  const pages = pagesFor(ws, context.viewer)
  const pageOf = (target: { sheetId?: string; recordId?: string }) => {
    const id = target.sheetId ?? (target.recordId ? openRowPage(ws, target.recordId) : null)
    if (!id) throw new Error('name a sheetId, or a recordId whose row page to use')
    pages.require(id)
    return id
  }
  const target = { sheetId: z.string().optional(), recordId: z.string().optional() }
  return [
    capability(
      'comment_list',
      "A page's comments, oldest first. Name the page by sheetId, or a table row by recordId (its row page).",
      target,
      true,
      (input) => listComments(ws, pageOf(input)),
    ),
    capability(
      'comment_add',
      'Comment on a page — or on a table row by recordId, on its row page — as the person you act for. threadId replies to a thread; mentions [{ id, name }] (from people_list) reach their Inbox.',
      {
        ...target,
        body: z.string().trim().min(1).max(4000),
        threadId: z.string().optional(),
        mentions: z.array(mentionRefSchema).max(20).default([]),
      },
      false,
      ({ sheetId, recordId, ...write }) =>
        postComment(
          ws,
          { ...write, sheetId: pageOf({ sheetId, recordId }) },
          { id: context.author, name: context.authorName },
        ),
    ),
  ]
}
