import { beforeEach, describe, expect, mock, test } from 'bun:test'
import type { AgentSession, AgentUpdate, TranscriptEntry } from '@washi/domain'
import { useAgentStore } from '../agent-store'
import { watchStall } from '../turn-watch'
import { mascotStateFor, turnViewOf } from '../utils'
import { TURN_CUT_OFF } from '../values'

let seq = 0
const entry = (update: AgentUpdate): TranscriptEntry => ({
  id: `e${++seq}`,
  seq,
  update,
  createdAt: `${Date.now().toString().padStart(14, '0')}-0000-test`,
})
const ask = (text: string) => entry({ kind: 'user_message', text })
const chunk = (text: string) => entry({ kind: 'message_chunk', text })
const failed = (error: string) => entry({ kind: 'turn_done', stopReason: 'error', error })
const done = () => entry({ kind: 'turn_done', stopReason: 'end_turn' })
const searching: AgentUpdate = {
  kind: 'tool_call',
  toolCallId: 't1',
  title: 'web_search',
  toolKind: 'search',
  status: 'in_progress',
}
const stopped = () => entry({ kind: 'turn_done', stopReason: 'cancelled' })

const session = (status: AgentSession['status'] = 'idle') =>
  ({
    id: 's1',
    provider: 'claude',
    title: 'One',
    status,
    costUsd: 0,
    model: null,
    effort: null,
    approvals: null,
    createdBy: 'rin',
    anchor: null,
    createdAt: '',
    updatedAt: '',
  }) satisfies AgentSession

type Handlers = { onStarted?: () => void; onData?: (value: { data: unknown }) => void }
const feeds: Record<string, Handlers> = {}
const feed = (name: string) => ({
  subscribe: (_input: unknown, handlers: Handlers) => {
    feeds[name] = handlers
    return { unsubscribe: () => {} }
  },
})

// What the server holds now; a test changes it to say a turn ended while nobody listened.
let server: { transcript: TranscriptEntry[]; activity: string } = {
  transcript: [],
  activity: 'idle',
}
const prompted: string[] = []
const reads: string[] = []
const client = {
  agents: {
    onAgentUpdate: feed('agentUpdate'),
    onApprovalRequested: feed('approvals'),
    onOpenSheetRequested: feed('openSheet'),
    onSessionChanged: feed('sessions'),
    listSessions: { query: async () => [session()] },
    pendingApprovals: { query: async () => [] },
    transcript: {
      query: async () => {
        reads.push('transcript')
        return server.transcript
      },
    },
    status: { query: async () => ({ state: server.activity }) },
    prompt: {
      mutate: async ({ text }: { text: string }) => {
        prompted.push(text)
      },
    },
    cancel: { mutate: async () => ({ cancelled: true }) },
    movedFrom: { query: async () => null },
  },
  sheets: { list: { query: async () => [] } },
}

// mock.module is process-wide and another file stubs this module too: each file brings its own.
const realApi = await import('../../../api')
mock.module('../../../api', () => ({ ...realApi, api: client }))

const agent = useAgentStore.getState
const settle = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms))
const onScreen = (transcript: TranscriptEntry[], running: boolean) =>
  useAgentStore.setState({ activeSessionId: 's1', sessions: [session()], transcript, running })

beforeEach(async () => {
  Object.assign(globalThis, { localStorage: { getItem: () => null, setItem: () => {} } })
  agent().reset()
  await agent().init()
  prompted.length = 0
  reads.length = 0
  server = { transcript: [], activity: 'idle' }
})

describe('one state per conversation (D114)', () => {
  test('working, stalled, failed and idle read off what the store holds', () => {
    const base = { sessions: [session()], activeSessionId: 's1', stalled: false }
    const running = [ask('draft it'), chunk('On it')]
    expect(turnViewOf({ ...base, transcript: running, running: true }).state).toBe('working')
    expect(turnViewOf({ ...base, transcript: running, running: true, stalled: true }).state).toBe(
      'stalled',
    )
    const broke = failed('the model provider rejected this key')
    expect(turnViewOf({ ...base, transcript: [ask('draft it'), broke], running: false })).toEqual({
      state: 'failed',
      failureText: 'the model provider rejected this key',
      endId: broke.id,
      startedAt: null,
      canRetry: true,
    })
    expect(turnViewOf({ ...base, transcript: [ask('x'), done()], running: false }).state).toBe(
      'idle',
    )
  })

  test('a stopped turn reads as stopped, with Retry, and the pill never says done', () => {
    const base = { sessions: [session()], activeSessionId: 's1', stalled: false, running: false }
    const stop = stopped()
    const transcript = [ask('search twice'), entry(searching), stop]
    expect(turnViewOf({ ...base, transcript })).toEqual({
      state: 'stopped',
      failureText: null,
      endId: stop.id,
      startedAt: null,
      canRetry: true,
    })
    expect(mascotStateFor(transcript, false, [])).toBe('idle')
    expect(mascotStateFor([ask('x'), done()], false, [])).toBe('done')
    expect(turnViewOf({ ...base, transcript: [...transcript, ask('again'), done()] }).state).toBe(
      'idle',
    )
  })

  test('a chat that errored before its receipt was written still reads as failed', () => {
    const view = turnViewOf({
      sessions: [session('error')],
      activeSessionId: 's1',
      stalled: false,
      transcript: [ask('draft it'), chunk('On it')],
      running: false,
    })
    expect(view).toMatchObject({ state: 'failed', failureText: TURN_CUT_OFF, endId: null })
  })
})

describe('a turn that goes quiet', () => {
  test('is stalled after the quiet, re-read once, and clears when a word arrives', async () => {
    const stop = watchStall(useAgentStore, 20)
    const asked = ask('draft it')
    server = { transcript: [asked], activity: 'working' }
    onScreen([asked], true)
    await settle(40)
    expect(agent().stalled).toBe(true)
    expect(reads).toContain('transcript')
    expect(agent().running).toBe(true)

    useAgentStore.setState((state) => ({ transcript: [...state.transcript, chunk('still here')] }))
    expect(agent().stalled).toBe(false)
    stop()
  })

  test('is not stalled while a question waits on the person', async () => {
    const stop = watchStall(useAgentStore, 20)
    onScreen([ask('fetch it')], true)
    useAgentStore.setState({
      approvals: [{ id: 'a1', sessionId: 's1', toolName: 'fetch_url', createdAt: '' }],
    })
    await settle(50)
    expect(agent().stalled).toBe(false)
    stop()
  })

  test('a stall whose turn already ended lands the receipt instead', async () => {
    const stop = watchStall(useAgentStore, 20)
    const receipt = failed('Washi stopped hearing back — the turn was ended')
    server = { transcript: [ask('draft it'), receipt], activity: 'idle' }
    onScreen([ask('draft it')], true)
    await settle(40)
    expect(agent().running).toBe(false)
    expect(turnViewOf(agent()).state).toBe('failed')
    stop()
  })
})

describe('a dropped socket', () => {
  test('a reconnect re-reads the chat, so a turn that ended meanwhile stops working', async () => {
    onScreen([ask('draft it'), chunk('On it')], true)
    server = { transcript: [ask('draft it'), chunk('On it'), done()], activity: 'idle' }
    feeds.agentUpdate?.onStarted?.()
    await settle()
    expect(reads).toEqual([])
    feeds.agentUpdate?.onStarted?.()
    await settle()
    expect(reads).toEqual(['transcript'])
    expect(agent().running).toBe(false)
    expect(turnViewOf(agent()).state).toBe('idle')
  })
})

describe('Retry', () => {
  test('a failed turn re-sends its ask', async () => {
    onScreen([ask('draft the roadmap'), failed('boom')], false)
    await agent().retryTurn()
    expect(prompted).toEqual(['draft the roadmap'])
  })

  test('over a stuck turn it stops first, then sends once the receipt lands', async () => {
    onScreen([ask('draft the roadmap'), chunk('On it')], true)
    const retrying = agent().retryTurn()
    await settle()
    expect(prompted).toEqual([])
    feeds.agentUpdate?.onData?.({
      data: { sessionId: 's1', entry: entry({ kind: 'turn_done', stopReason: 'cancelled' }) },
    })
    await retrying
    expect(prompted).toEqual(['draft the roadmap'])
  })
})
