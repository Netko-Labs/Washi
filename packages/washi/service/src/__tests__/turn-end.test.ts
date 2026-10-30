import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import type { AgentUpdate } from '@washi/domain'
import {
  createSession,
  getTranscript,
  listSessions,
  openWorkspace,
  updateSession,
  type Workspace,
} from '@washi/repository'
import { AgentHost } from '../agents/host'
import { AFTER_STOP, type AgentKeySource, TURN_INTERRUPTED, TURN_STALLED } from '../agents/lib'
import type { AgentPort, PromptRequest, TurnResult } from '../agents/ports'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'turn-end', path: ':memory:' })
})
afterEach(() => ws.close())

const KEY: AgentKeySource = {
  resolve: async () => ({ kind: 'api_key', apiKey: 'k', provider: 'anthropic', model: 'm' }),
  status: async () => ({
    preference: 'auto',
    active: 'api_key',
    localCli: null,
    localModel: null,
    apiKey: null,
    missing: null,
  }),
}

type Run = (request: PromptRequest, emit: (update: AgentUpdate) => void) => Promise<TurnResult>

function hostWith(run: Run, limits = { quietMs: 30, graceMs: 30 }) {
  const host = new AgentHost(ws, KEY)
  const port: AgentPort = { id: 'anthropic', prompt: run }
  Object.assign(host, { claudePort: port, limits })
  return host
}

const receipts = (sessionId: string) =>
  getTranscript(ws, sessionId)
    .map((entry) => entry.update)
    .filter((update) => update.kind === 'turn_done')

const statusOf = (sessionId: string) =>
  listSessions(ws).find((session) => session.id === sessionId)?.status

const never = () => new Promise<TurnResult>(() => {})

describe('every turn ends in exactly one turn_done (D114)', () => {
  test('a port that throws ends the turn in its words, and the chat says error', async () => {
    const host = hostWith(async () => {
      throw new Error('the socket hung up')
    })
    const session = createSession(ws, 'throws')
    await host.prompt(session.id, 'hello')
    expect(receipts(session.id)).toEqual([
      expect.objectContaining({ stopReason: 'error', error: 'the socket hung up' }),
    ])
    expect(statusOf(session.id)).toBe('error')
    expect(host.isRunning(session.id)).toBe(false)
  })

  test('a port that goes quiet and ignores the abort is ended for it; its late words are dropped', async () => {
    let late: (result: TurnResult) => void = () => {}
    let say: (update: AgentUpdate) => void = () => {}
    const host = hostWith((_request, emit) => {
      say = emit
      return new Promise((resolve) => {
        late = resolve
      })
    })
    const session = createSession(ws, 'hangs')
    await host.prompt(session.id, 'hello')
    expect(receipts(session.id)).toEqual([
      expect.objectContaining({ stopReason: 'error', error: TURN_STALLED }),
    ])
    expect(statusOf(session.id)).toBe('error')
    expect(host.isRunning(session.id)).toBe(false)

    const before = getTranscript(ws, session.id).length
    say({ kind: 'message_chunk', text: 'too late' })
    late({ costUsd: 0.01, billing: 'metered' })
    await Bun.sleep(5)
    expect(getTranscript(ws, session.id)).toHaveLength(before)
    expect(statusOf(session.id)).toBe('error')
  })

  test('a quiet port that honours the abort still reads as stalled, not as Stop', async () => {
    const host = hostWith(
      (request) =>
        new Promise((resolve) => {
          request.signal?.addEventListener('abort', () =>
            resolve({ costUsd: null, billing: 'metered', cancelled: true }),
          )
        }),
    )
    const session = createSession(ws, 'quiet')
    await host.prompt(session.id, 'hello')
    expect(receipts(session.id)).toEqual([
      expect.objectContaining({ stopReason: 'error', error: TURN_STALLED }),
    ])
  })

  test('a port that keeps streaming is never stalled', async () => {
    const host = hostWith(async (request) => {
      for (let tick = 0; tick < 6; tick++) {
        await Bun.sleep(15)
        request.onActivity?.()
      }
      return { costUsd: null, billing: 'metered' }
    })
    const session = createSession(ws, 'busy')
    await host.prompt(session.id, 'hello')
    expect(receipts(session.id)).toEqual([expect.objectContaining({ stopReason: 'end_turn' })])
    expect(statusOf(session.id)).toBe('idle')
  })

  test('a question waiting on a person is not silence', async () => {
    let host: AgentHost | null = null
    host = hostWith(async (request) => {
      // biome-ignore lint/complexity/useLiteralKeys: reaching into a private member for the test
      const desk = host?.['approvals']
      const pending = desk?.gateSdkTool(request.sessionId, 'mcp__washi__action_run', { action: {} })
      await Bun.sleep(100)
      desk?.dropSession(request.sessionId)
      await pending
      return { costUsd: null, billing: 'metered' }
    })
    const session = createSession(ws, 'asking')
    await host.prompt(session.id, 'hello')
    expect(receipts(session.id)).toEqual([expect.objectContaining({ stopReason: 'end_turn' })])
  })

  test('Stop on a port that never returns ends the turn as stopped after the grace', async () => {
    const host = hostWith(never, { quietMs: 60_000, graceMs: 20 })
    const session = createSession(ws, 'stop')
    const turn = host.prompt(session.id, 'hello')
    await Bun.sleep(5)
    expect(host.cancel(session.id)).toBe(true)
    await turn
    expect(receipts(session.id)).toEqual([expect.objectContaining({ stopReason: 'cancelled' })])
    expect(statusOf(session.id)).toBe('idle')
  })
})

describe('the ask after a Stop', () => {
  test('tells the model its last turn was stopped, once', async () => {
    const said: string[] = []
    const host = hostWith(
      (request) =>
        new Promise((resolve) => {
          said.push(request.text)
          if (said.length > 1) resolve({ costUsd: null, billing: 'metered' })
        }),
      { quietMs: 60_000, graceMs: 20 },
    )
    const session = createSession(ws, 'after stop')
    const turn = host.prompt(session.id, 'search twice')
    await Bun.sleep(5)
    host.cancel(session.id)
    await turn
    await host.prompt(session.id, 'again')
    await host.prompt(session.id, 'and once more')
    expect(said).toEqual(['search twice', `${AFTER_STOP}\n\nagain`, 'and once more'])
  })
})

describe('a turn cut off by a restart says so', () => {
  test('boot lands a receipt in its words, so the chat shows why it stopped', () => {
    const session = createSession(ws, 'cut off')
    updateSession(ws, session.id, { status: 'running' })
    new AgentHost(ws)
    expect(receipts(session.id)).toEqual([
      expect.objectContaining({ stopReason: 'error', error: TURN_INTERRUPTED }),
    ])
    expect(statusOf(session.id)).toBe('error')
  })
})

describe('a new chat is named by its first ask', () => {
  test('the rename tells the list, so the panel header stops saying Session N', async () => {
    const host = hostWith(async () => ({ costUsd: null, billing: 'metered' }))
    const changed: string[] = []
    host.setEvents({
      update: () => {},
      approval: () => {},
      openSheet: () => {},
      sessionChanged: (id) => changed.push(id),
    })
    const session = createSession(ws, 'Session 17')
    await host.prompt(session.id, 'Plan the offsite in Kyoto')
    expect(listSessions(ws).find((each) => each.id === session.id)?.title).not.toBe('Session 17')
    expect(changed).toContain(session.id)
  })
})
