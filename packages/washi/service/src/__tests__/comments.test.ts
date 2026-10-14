import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
  countUnreadMentions,
  deleteSheet,
  listComments,
  listMentions,
  markMentionsRead,
  openWorkspace,
  purgeSheet,
  type Workspace,
} from '@washi/repository'
import { CommentError, postComment, removeComment, resolveThread } from '../comments/service'
import { createSheetFromSource } from '../sheets/service'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
})
afterEach(() => ws.close())

const ana = { id: 'u-ana', name: 'Ana' }
const kenji = { id: 'u-kenji', name: 'Kenji' }
const page = (title: string) =>
  createSheetFromSource(ws, { title, source: `<Sheet title="${title}"><Text>x</Text></Sheet>` })

describe('comments', () => {
  test('a mention lands in that person’s Inbox, never the author’s, never twice', () => {
    const sheet = page('Plan')
    postComment(
      ws,
      { sheetId: sheet.id, body: '@Kenji @Ana look', mentions: [kenji, kenji, ana] },
      ana,
    )
    expect(countUnreadMentions(ws, kenji.id)).toBe(1)
    expect(countUnreadMentions(ws, ana.id)).toBe(0)
    expect(listMentions(ws, kenji.id)[0]).toMatchObject({ sheetTitle: 'Plan', authorName: 'Ana' })

    markMentionsRead(ws, kenji.id, { sheetId: sheet.id })
    expect(countUnreadMentions(ws, kenji.id)).toBe(0)
    expect(listMentions(ws, kenji.id)[0]?.isRead).toBe(true)
  })

  test('replies stay on their own page; resolving marks the thread', () => {
    const plan = page('Plan')
    const other = page('Other')
    const thread = postComment(ws, { sheetId: plan.id, body: 'first', mentions: [] }, ana)
    postComment(ws, { sheetId: plan.id, threadId: thread.id, body: 'reply', mentions: [] }, kenji)
    expect(() =>
      postComment(ws, { sheetId: other.id, threadId: thread.id, body: 'x', mentions: [] }, ana),
    ).toThrow(CommentError)

    resolveThread(ws, thread.id, true)
    expect(listComments(ws, plan.id).find((comment) => comment.id === thread.id)?.resolved).toBe(
      true,
    )
  })

  test('only the author deletes; a thread takes its replies', () => {
    const plan = page('Plan')
    const thread = postComment(ws, { sheetId: plan.id, body: 'first', mentions: [kenji] }, ana)
    postComment(ws, { sheetId: plan.id, threadId: thread.id, body: 'reply', mentions: [] }, kenji)
    expect(() => removeComment(ws, thread.id, kenji.id)).toThrow(CommentError)

    removeComment(ws, thread.id, ana.id)
    expect(listComments(ws, plan.id)).toHaveLength(0)
    expect(countUnreadMentions(ws, kenji.id)).toBe(0)
  })

  test('a trashed page hides its mentions; purging it removes its discussion', () => {
    const plan = page('Plan')
    postComment(ws, { sheetId: plan.id, body: 'hi', mentions: [kenji] }, ana)
    deleteSheet(ws, plan.id)
    expect(listMentions(ws, kenji.id)).toHaveLength(0)

    purgeSheet(ws, plan.id)
    expect(listComments(ws, plan.id)).toHaveLength(0)
  })
})
