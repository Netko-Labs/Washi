import { beforeEach, describe, expect, mock, test } from 'bun:test'
import type { AgentSession, ChatMove } from '@washi/domain'
import { paperHost } from '../../../paper-host'
import { useRowOpenerStore } from '../../row-opener/row-opener-store'
import { useViewStore } from '../../view/view-store'
import { useAgentStore } from '../agent-store'
import { pickChat, scopeOfTab } from '../utils'

const chat = (id: string, sheetId: string | null, createdBy: string | null = 'rin') =>
  ({
    id,
    provider: 'claude',
    title: id,
    status: 'idle',
    costUsd: 0,
    model: null,
    effort: null,
    approvals: null,
    createdBy,
    anchor: sheetId ? { sheetId, scope: 'page' } : null,
    createdAt: '',
    updatedAt: '',
  }) satisfies AgentSession

// Newest first, as the server lists them.
const SESSIONS = [
  chat('plan-new', 'plan'),
  chat('home-routine', null, null),
  chat('plan-old', 'plan'),
  chat('home', null),
]
const MOVE: ChatMove = { sessionId: 'plan-new', sheetId: 'plan', title: 'plan-new', at: '' }

const feed = { subscribe: () => ({ unsubscribe: () => {} }) }
type OpenRequest = { id: string; sessionId: string; handover?: boolean }
let requestOpen: (request: OpenRequest) => void = () => {}
const openFeed = {
  subscribe: (_input: unknown, handlers: { onData: (event: { data: OpenRequest }) => void }) => {
    requestOpen = (data) => handlers.onData({ data })
    return { unsubscribe: () => {} }
  },
}
// A creation the test lets land when it chooses; prompts are recorded by the chat they went to.
let landCreation: (session: AgentSession) => void = () => {}
const prompted: string[] = []
const client = {
  agents: {
    onAgentUpdate: feed,
    onApprovalRequested: feed,
    onOpenSheetRequested: openFeed,
    onSessionChanged: feed,
    listSessions: { query: async () => SESSIONS },
    pendingApprovals: { query: async () => [] },
    transcript: { query: async () => [] },
    createSession: {
      mutate: () =>
        new Promise<AgentSession>((resolve) => {
          landCreation = resolve
        }),
    },
    prompt: {
      mutate: async ({ sessionId }: { sessionId: string }) => {
        prompted.push(sessionId)
      },
    },
    movedFrom: {
      query: async ({ sheetId }: { sheetId: string }) => (sheetId === 'kyoto' ? MOVE : null),
    },
  },
  tables: { openRow: { mutate: async () => ({ sheetId: 'row-page' }) } },
  sheets: { list: { query: async () => [] } },
}

// mock.module is process-wide and another file stubs this module too: each file brings its own.
const realApi = await import('../../../api')
mock.module('../../../api', () => ({ ...realApi, api: client }))

const memory = new Map<string, string>()
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))
const agent = useAgentStore.getState
const open = async (tab: Parameters<ReturnType<typeof useViewStore.getState>['openTab']>[0]) => {
  useViewStore.getState().openTab(tab)
  await settle()
}

beforeEach(async () => {
  memory.clear()
  Object.assign(globalThis, {
    localStorage: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => memory.set(key, value),
    },
  })
  useViewStore.getState().closeAll()
  agent().reset()
  agent().bind('org_a')
  await agent().init()
})

describe('the route picks the chat (D110)', () => {
  test('a page tab is its scope, any other screen Home; the chats screens pick their own', () => {
    expect(scopeOfTab('note:plan')).toBe('plan')
    expect(scopeOfTab('view:inbox')).toBeNull()
    expect(scopeOfTab(null)).toBeNull()
    expect(scopeOfTab('view:chats')).toBeUndefined()
  })

  test('the newest of your own chats here, unless you picked another here last', () => {
    expect(pickChat(SESSIONS, 'plan', null)).toBe('plan-new')
    expect(pickChat(SESSIONS, 'plan', 'plan-old')).toBe('plan-old')
    expect(pickChat(SESSIONS, 'plan', 'home')).toBe('plan-new')
    expect(pickChat(SESSIONS, null, null)).toBe('home')
    expect(pickChat(SESSIONS, 'kyoto', null)).toBeNull()
  })

  test('a page with chats shows its newest; Home shows yours, never a routine’s', async () => {
    await open('note:plan')
    expect(agent().activeSessionId).toBe('plan-new')
    await open('view:inbox')
    expect(agent().activeSessionId).toBe('home')
    expect(agent().scope).toBeNull()
  })

  test('a page without chats is a draft anchored there, saying what moved away', async () => {
    await open('note:kyoto')
    expect(agent().activeSessionId).toBeNull()
    expect(agent().scope).toBe('kyoto')
    expect(agent().moved).toEqual(MOVE)
  })

  test('the chat picked in a place comes back with the place', async () => {
    await open('note:plan')
    await agent().selectSession('plan-old')
    await open('view:dashboard')
    await open('note:plan')
    expect(agent().activeSessionId).toBe('plan-old')
  })

  test('a peeked row keeps the page under it as the scope', async () => {
    await open('note:plan')
    const unregister = useRowOpenerStore.getState().register(() => {})
    paperHost.openRow?.('record-1')
    await settle()
    expect(useViewStore.getState().activeTab).toBe('note:plan')
    expect(agent().scope).toBe('plan')
    expect(agent().activeSessionId).toBe('plan-new')
    unregister()
  })
})

describe('a chat made while the person moves (D110)', () => {
  test('it waits in the place it was made for; the send still goes to it', async () => {
    await open('note:kyoto')
    const sending = agent().sendPrompt('plan the trip')
    await settle()
    await open('note:plan')
    landCreation(chat('kyoto-new', 'kyoto'))
    await sending
    await settle()
    expect(agent().scope).toBe('plan')
    expect(agent().activeSessionId).toBe('plan-new')
    expect(prompted.at(-1)).toBe('kyoto-new')
    expect([...memory.values()]).toContain('kyoto-new')
  })
})

describe('a page Washi opens moves only the chat it came from (D110)', () => {
  test('another chat’s page, a teammate’s or a routine’s, moves nothing here', async () => {
    await open('note:plan')
    requestOpen({ id: 'theirs', sessionId: 'someone-else' })
    requestOpen({ id: 'theirs', sessionId: 'home-routine', handover: true })
    expect(useViewStore.getState().activeTab).toBe('note:plan')
    expect(agent().activeSessionId).toBe('plan-new')
  })

  test('a page the chat on screen made opens with that chat still on screen', async () => {
    await open('note:plan')
    requestOpen({ id: 'made', sessionId: 'plan-new' })
    await settle()
    expect(useViewStore.getState().activeTab).toBe('note:made')
    expect(agent().activeSessionId).toBe('plan-new')
    expect(agent().sessions.find((each) => each.id === 'plan-new')?.anchor?.sheetId).toBe('plan')
  })

  test('a handover takes the chat on screen with it, panel open', async () => {
    await open('note:plan')
    requestOpen({ id: 'kyoto', sessionId: 'plan-new', handover: true })
    await settle()
    expect(useViewStore.getState().activeTab).toBe('note:kyoto')
    expect(agent().activeSessionId).toBe('plan-new')
    expect(agent().scope).toBe('kyoto')
    expect(agent().panelOpen).toBe(true)
  })
})
