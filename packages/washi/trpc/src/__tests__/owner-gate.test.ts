import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { tmpdir } from 'node:os'
import { createFileStore, localBlobStore, openWorkspace, type Workspace } from '@washi/repository'
import { AgentHost } from '@washi/service'
import {
  appRouter,
  type ControlPlane,
  createContext,
  createEventBus,
  createPresenceBoard,
  type ServerRuntime,
} from '../index'

const WORKSPACE = 'w1'

/** Two people, one workspace: `owner` runs it, `member` is on it. */
const control: ControlPlane = {
  async authenticate() {
    return null
  },
  async authorize() {
    return true
  },
  async listWorkspaces(actorId) {
    return [{ id: WORKSPACE, name: 'Team', role: actorId === 'owner' ? 'owner' : 'member' }]
  },
  async listMembers() {
    return []
  },
  async workspaceIds() {
    return [WORKSPACE]
  },
  async handle() {
    return null
  },
  async close() {},
}

let ws: Workspace
let host: AgentHost
let runtime: ServerRuntime
beforeEach(() => {
  ws = openWorkspace({ id: WORKSPACE, path: ':memory:' })
  host = new AgentHost(ws)
  runtime = {
    mode: 'hosted',
    events: createEventBus(),
    resolve: () => ({ workspace: ws, host, files: createFileStore(ws, localBlobStore(tmpdir())) }),
    control,
    defaultWorkspaceId: WORKSPACE,
    presence: createPresenceBoard(() => {}),
  }
})
afterEach(() => ws.close())

const callerFor = (id: string) =>
  appRouter.createCaller(
    createContext(runtime, { workspaceId: WORKSPACE, actor: { id, email: `${id}@x`, name: id } }),
  )

describe('what widens the agent is the owner’s call', () => {
  test('a member cannot switch approvals to auto, and the mode stays ask', async () => {
    await expect(callerFor('member').agents.setApprovalMode({ mode: 'auto' })).rejects.toThrow(
      'only a workspace owner',
    )
    expect(host.approvalMode()).toBe('ask')
  })

  test('an owner can', async () => {
    expect(await callerFor('owner').agents.setApprovalMode({ mode: 'auto' })).toEqual({
      mode: 'auto',
    })
    expect(host.approvalMode()).toBe('auto')
  })

  test('a member cannot set an integration key either', async () => {
    await expect(
      callerFor('member').workspaces.setIntegrationKey({ integration: 'exa', key: 'exa-12345678' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })
})
