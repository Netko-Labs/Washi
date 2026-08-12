import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import type { ApprovalRequest, TranscriptEntry } from '@washi/desktop-domain'
import {
  closeDb,
  createSession,
  getTranscript,
  initializeDb,
  listSheets,
} from '@washi/desktop-repository'
import { AgentHost } from '../agents/host'
import { normalizeMessage } from '../agents/normalize'
import { checkSource, createSheetFromSource } from '../sheets/service'
import { defineUserTable, runQuery } from '../tables/service'

beforeEach(() => initializeDb(':memory:'))
afterEach(() => closeDb())

function makeHost() {
  const updates: TranscriptEntry[] = []
  const approvals: ApprovalRequest[] = []
  const opened: string[] = []
  const host = new AgentHost()
  host.setEvents({
    update: (_sessionId, entry) => updates.push(entry),
    approval: (request) => approvals.push(request),
    openSheet: (id) => opened.push(id),
  })
  return { host, updates, approvals, opened }
}

describe('normalize', () => {
  test('assistant text + tool_use → chunks and tool calls', () => {
    const updates = normalizeMessage({
      type: 'assistant',
      message: {
        content: [
          { type: 'text', text: 'On it.' },
          { type: 'tool_use', id: 't1', name: 'mcp__washi__sheet_check', input: { source: 'x' } },
        ],
      },
      session_id: 's',
    } as never)
    expect(updates[0]).toMatchObject({ kind: 'message_chunk', text: 'On it.' })
    expect(updates[1]).toMatchObject({
      kind: 'tool_call',
      toolCallId: 't1',
      title: 'sheet_check',
      toolKind: 'read',
    })
  })

  test('tool_result and result → update and turn_done', () => {
    const updates = normalizeMessage({
      type: 'user',
      message: {
        content: [{ type: 'tool_result', tool_use_id: 't1', is_error: false, content: 'ok' }],
      },
      session_id: 's',
    } as never)
    expect(updates[0]).toMatchObject({
      kind: 'tool_call_update',
      status: 'completed',
      output: 'ok',
    })

    const done = normalizeMessage({
      type: 'result',
      subtype: 'success',
      total_cost_usd: 0.12,
    } as never)
    expect(done[0]).toMatchObject({ kind: 'turn_done', stopReason: 'end_turn', costUsd: 0.12 })
  })
})

describe('hanko actions through the host', () => {
  test('sheet.create creates and opens; table.insert writes', async () => {
    const { host, opened } = makeHost()
    await host.executeAction({ verb: 'sheet.create', title: 'From an action' })
    expect(listSheets().some((sheet) => sheet.title === 'From an action')).toBe(true)
    expect(opened).toHaveLength(1)

    defineUserTable({ name: 'tasks', columns: [{ name: 'title', type: 'text' }] })
    await host.executeAction({ verb: 'table.insert', table: 'tasks', data: { title: 'stamped' } })
    expect(runQuery({ table: 'tasks' }).rows[0]?.title).toBe('stamped')
  })

  test('unknown verbs and private url.open are refused', async () => {
    const { host } = makeHost()
    await expect(host.executeAction({ verb: 'fs.delete' })).rejects.toThrow('unknown action verb')
    await expect(
      host.executeAction({ verb: 'url.open', url: 'https://192.168.1.1/admin' }),
    ).rejects.toThrow('public https')
  })
})

describe('approval flow', () => {
  test('pending approval resolves the gate; denial and audit rows work', async () => {
    const { host, approvals } = makeHost()
    const session = createSession('test')

    // biome-ignore lint/complexity/useLiteralKeys: reaching into a private member for the test
    const gate = host['gateTool'].bind(host) as (
      sessionId: string,
      tool: string,
      input: Record<string, unknown>,
    ) => Promise<{ behavior: string }>

    const pendingAllow = gate(session.id, 'mcp__washi__sheet_create', { title: 'x' })
    await Bun.sleep(5)
    expect(approvals).toHaveLength(1)
    host.resolveApprovalRequest(approvals[0]!.id, 'allow_once')
    expect((await pendingAllow).behavior).toBe('allow')

    const pendingDeny = gate(session.id, 'mcp__washi__db_mutate', { mutation: {} })
    await Bun.sleep(5)
    host.resolveApprovalRequest(approvals[1]!.id, 'reject_once')
    expect((await pendingDeny).behavior).toBe('deny')
  })

  test('reads pass without approval; non-washi tools always denied', async () => {
    const { host, approvals } = makeHost()
    const session = createSession('test')
    // biome-ignore lint/complexity/useLiteralKeys: reaching into a private member for the test
    const gate = host['gateTool'].bind(host) as (
      sessionId: string,
      tool: string,
      input: Record<string, unknown>,
    ) => Promise<{ behavior: string }>

    expect((await gate(session.id, 'mcp__washi__sheet_list', {})).behavior).toBe('allow')
    expect((await gate(session.id, 'Bash', { command: 'rm -rf /' })).behavior).toBe('deny')
    expect(approvals).toHaveLength(0)
  })
})

describe('transcript persistence', () => {
  test('user prompts and updates land in agent_turns in order', () => {
    const { host } = makeHost()
    const session = createSession('t')
    // biome-ignore lint/complexity/useLiteralKeys: reaching into a private member for the test
    const record = host['record'].bind(host) as (sessionId: string, update: unknown) => void
    record(session.id, { kind: 'user_message', text: 'hello' })
    record(session.id, { kind: 'message_chunk', text: 'hi' })
    const transcript = getTranscript(session.id)
    expect(transcript.map((entry) => entry.seq)).toEqual([1, 2])
    expect(transcript[0]?.update).toMatchObject({ kind: 'user_message' })
  })
})

describe('wsx guardrails stay closed for agents', () => {
  test('sheet_check catches executable smuggling; valid sheets save', () => {
    expect(checkSource('<Sheet title={window.location} />').ok).toBe(false)
    expect(checkSource('<Sheet title="ok"><P>fine</P></Sheet>').ok).toBe(true)
    const sheet = createSheetFromSource({
      title: 'ok',
      source: '<Sheet title="ok"><P>fine</P></Sheet>',
    })
    expect(sheet.id).toBeTruthy()
  })
})
