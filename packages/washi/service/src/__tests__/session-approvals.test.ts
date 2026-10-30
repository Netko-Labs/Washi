import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
  createSession,
  getSession,
  listCapabilityCalls,
  openWorkspace,
  type Workspace,
} from '@washi/repository'
import { ApprovalDesk, SessionApprovalsError } from '../agents/approvals'
import { CapabilityDesk } from '../agents/desk'
import { AgentHost } from '../agents/host'

let ws: Workspace
let desk: ApprovalDesk
let mine: string
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  desk = new ApprovalDesk(ws, () => null, new CapabilityDesk(ws, () => null))
  mine = createSession(ws, 'Mine', { createdBy: 'ana' }).id
})
afterEach(() => {
  desk.dropSession(mine)
  ws.close()
})

const within = (promise: Promise<boolean>) =>
  Promise.race([promise, new Promise<'waiting'>((done) => setTimeout(() => done('waiting'), 10))])

describe('a conversation may approve everything, where the workspace allows it (D115)', () => {
  test('refused while the workspace does not allow it', () => {
    expect(desk.yoloAllowed()).toBe(false)
    expect(() => desk.checkSessionApprovals(mine, 'auto', 'ana')).toThrow(SessionApprovalsError)
  })

  test('refused to anyone but the chat’s starter, and on a workspace chat', () => {
    desk.setYoloAllowed(true)
    const routine = createSession(ws, 'Routine').id
    expect(() => desk.checkSessionApprovals(mine, 'auto', 'ben')).toThrow(SessionApprovalsError)
    expect(() => desk.checkSessionApprovals(routine, 'auto', 'ana')).toThrow(SessionApprovalsError)
    expect(() => desk.checkSessionApprovals(mine, 'auto', 'ana')).not.toThrow()
  })

  test('auto passes what leaves, ledgered as auto and signed by its starter', async () => {
    const host = new AgentHost(ws)
    host.setYoloAllowed(true)
    host.setSessionOptions(mine, { approvals: 'auto' }, 'ana')
    const gate = new ApprovalDesk(ws, () => null, new CapabilityDesk(ws, () => null))
    expect(await within(gate.approve(mine, 'fetch_url', { url: 'https://x.dev' }))).toBe(true)
    expect(await within(gate.approve(mine, 'web_search', { query: 'loro' }))).toBe(true)
    expect(await within(gate.approve(mine, 'action_run', { action: {} }))).toBe(true)
    const [latest] = listCapabilityCalls(ws, 1)
    expect(latest).toMatchObject({ subject: 'action_run', decision: 'auto', actorId: 'ana' })
  })

  test('policy refusals still refuse, and another conversation still asks', async () => {
    desk.setYoloAllowed(true)
    new AgentHost(ws).setSessionOptions(mine, { approvals: 'auto' }, 'ana')
    expect(await within(desk.approve(mine, 'fetch_url', { url: 'http://x.dev' }))).toBe(false)
    const other = createSession(ws, 'Other', { createdBy: 'ana' }).id
    expect(await within(desk.approve(other, 'fetch_url', { url: 'https://x.dev' }))).toBe('waiting')
    desk.dropSession(other)
  })

  test('turning it off puts every conversation back on ask', async () => {
    const host = new AgentHost(ws)
    host.setYoloAllowed(true)
    host.setSessionOptions(mine, { approvals: 'auto' }, 'ana')
    expect(host.setYoloAllowed(false).yoloAllowed).toBe(false)
    expect(getSession(ws, mine)?.approvals).toBeNull()
    expect(await within(desk.approve(mine, 'fetch_url', { url: 'https://x.dev' }))).toBe('waiting')
  })

  test('a conversation may ask even when the workspace is on auto', async () => {
    desk.setMode('auto')
    desk.setYoloAllowed(true)
    new AgentHost(ws).setSessionOptions(mine, { approvals: 'ask' }, 'ana')
    expect(await within(desk.approve(mine, 'fetch_url', { url: 'https://x.dev' }))).toBe('waiting')
  })
})
