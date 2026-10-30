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
  type StorageInfo,
  type StorageStore,
} from '../index'

const WORKSPACE = 'w1'

let saved: StorageInfo | null = null
const storage: StorageStore = {
  async info() {
    return saved
  },
  async set(_workspaceId, actorId, config) {
    const { secretAccessKey: _secret, accessKeyId, ...rest } = config
    saved = {
      ...rest,
      accessKeyLast4: accessKeyId.slice(-4),
      updatedAt: new Date(),
      updatedBy: actorId,
    }
    return saved
  },
  async remove() {
    saved = null
  },
}

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
  storage,
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
afterEach(() => {
  ws.close()
  saved = null
})

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

describe('where uploads go is the owner’s call', () => {
  /** Nothing listens on port 1, so the test file never lands. */
  const unreachable = {
    endpoint: 'http://127.0.0.1:1',
    region: 'auto',
    bucket: 'team',
    accessKeyId: 'AKIAEXAMPLE1234',
    secretAccessKey: 'not-a-real-secret',
  }

  test('a member reads where uploads go, without a secret in it', async () => {
    expect(await callerFor('member').storage.get()).toEqual({
      isAvailable: true,
      isServerDefault: true,
      config: null,
    })
  })

  test('a member cannot test, set or remove a bucket', async () => {
    const member = callerFor('member')
    await expect(member.storage.test(unreachable)).rejects.toMatchObject({ code: 'FORBIDDEN' })
    await expect(member.storage.set(unreachable)).rejects.toMatchObject({ code: 'FORBIDDEN' })
    await expect(member.storage.remove()).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  test('an owner cannot save a bucket that failed its test, and nothing is kept', async () => {
    await expect(callerFor('owner').storage.set(unreachable)).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'That address is inside the server’s own network. Only the app admin can use one.',
    })
    expect(saved).toBeNull()
  })

  test('an owner hears the refusal in words — a loopback bucket is the app admin’s alone', async () => {
    expect(await callerFor('owner').storage.test(unreachable)).toEqual({
      ok: false,
      reason: 'That address is inside the server’s own network. Only the app admin can use one.',
    })
  })
})

describe('a conversation approving everything is its starter’s, where an owner allows it', () => {
  test('a member cannot allow it; refused for a chat while it is off', async () => {
    const member = callerFor('member')
    await expect(member.agents.setYoloAllowed({ allowed: true })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
    const chat = await member.agents.createSession({ title: 'Mine' })
    await expect(
      member.agents.setSessionOptions({ sessionId: chat.id, approvals: 'auto' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  test('allowed, the starter switches it on; off again resets it', async () => {
    expect((await callerFor('owner').agents.setYoloAllowed({ allowed: true })).yoloAllowed).toBe(
      true,
    )
    const member = callerFor('member')
    const chat = await member.agents.createSession({ title: 'Mine' })
    const set = await member.agents.setSessionOptions({ sessionId: chat.id, approvals: 'auto' })
    expect(set?.approvals).toBe('auto')
    await callerFor('owner').agents.setYoloAllowed({ allowed: false })
    const [listed] = await member.agents.listSessions()
    expect(listed?.approvals).toBeNull()
  })
})
