import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
  appendTurn,
  createSession,
  deleteSession,
  isSessionVisible,
  listSessions,
  openWorkspace,
  searchChats,
  updateSession,
  type Workspace,
} from '../index'

let ws: Workspace

beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
})
afterEach(() => ws.close())

function say(sessionId: string, ask: string, reply: string[]) {
  appendTurn(ws, sessionId, { kind: 'user_message', text: ask })
  for (const text of reply) appendTurn(ws, sessionId, { kind: 'message_chunk', text })
  appendTurn(ws, sessionId, { kind: 'turn_done', stopReason: 'end_turn' })
}

describe('a chat is its starter’s (D67)', () => {
  test('each person lists their own chats and the workspace’s', () => {
    const mine = createSession(ws, 'mine', { createdBy: 'ana' })
    const theirs = createSession(ws, 'theirs', { createdBy: 'ben' })
    const shared = createSession(ws, 'a routine run')

    expect(
      listSessions(ws, 'ana')
        .map((s) => s.id)
        .sort(),
    ).toEqual([mine.id, shared.id].sort())
    expect(listSessions(ws, null).map((s) => s.id)).toEqual([shared.id])
    expect(listSessions(ws)).toHaveLength(3)
    expect(isSessionVisible(ws, theirs.id, 'ana')).toBe(false)
    expect(isSessionVisible(ws, shared.id, 'ana')).toBe(true)
    expect(isSessionVisible(ws, 'gone', 'ana')).toBe(true)
  })

  test('an anchor round-trips', () => {
    const chat = createSession(ws, 'roadmap', {
      createdBy: 'ana',
      anchor: { sheetId: 'sheet-1', scope: 'subtree' },
    })
    expect(chat.anchor).toEqual({ sheetId: 'sheet-1', scope: 'subtree' })
    expect(chat.createdBy).toBe('ana')
    expect(createSession(ws, 'loose').anchor).toBeNull()
  })
})

describe('chat search', () => {
  test('finds a word split across streamed chunks, by prefix, only in chats you can read', () => {
    const mine = createSession(ws, 'Q3 planning', { createdBy: 'ana' })
    const theirs = createSession(ws, 'Secret', { createdBy: 'ben' })
    say(mine.id, 'what slipped last sprint?', ['The onboar', 'ding revamp slipped a week.'])
    say(theirs.id, 'onboarding salaries', ['private'])

    const hits = searchChats(ws, 'ana', 'onboard', 10)
    expect(hits.map((hit) => hit.sessionId)).toEqual([mine.id])
    expect(hits[0]?.snippet).toContain('⟦onboarding⟧')
  })

  test('a rename is searchable; a deleted chat is gone; FTS syntax is literal', () => {
    const chat = createSession(ws, 'untitled', { createdBy: 'ana' })
    updateSession(ws, chat.id, { title: 'Hiring plan' })
    expect(searchChats(ws, 'ana', 'hiring', 10)).toHaveLength(1)
    expect(searchChats(ws, 'ana', 'hiring OR "x', 10)).toEqual([])
    deleteSession(ws, chat.id)
    expect(searchChats(ws, 'ana', 'hiring', 10)).toEqual([])
  })
})
