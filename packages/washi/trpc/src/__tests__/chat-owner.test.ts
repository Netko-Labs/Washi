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

/** Two people, one workspace. Even its owner does not read another person's chat (D67). */
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

describe('a chat is its starter’s (D67)', () => {
  test('only its starter lists, reads, renames or deletes it', async () => {
    const chat = await callerFor('member').agents.createSession({ title: 'my own question' })
    expect(chat.createdBy).toBe('member')

    const owner = callerFor('owner')
    expect(await owner.agents.listSessions()).toEqual([])
    await expect(owner.agents.transcript({ sessionId: chat.id })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
    await expect(
      owner.agents.renameSession({ sessionId: chat.id, title: 'mine now' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    await expect(owner.agents.deleteSession({ sessionId: chat.id })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })

    const member = callerFor('member')
    expect((await member.agents.listSessions()).map((session) => session.id)).toEqual([chat.id])
    expect(await member.agents.transcript({ sessionId: chat.id })).toEqual([])
  })

  test('a chat may be anchored to a page and its subtree', async () => {
    const chat = await callerFor('member').agents.createSession({
      title: 'roadmap',
      anchor: { sheetId: 'sheet-1', scope: 'subtree' },
    })
    expect(chat.anchor).toEqual({ sheetId: 'sheet-1', scope: 'subtree' })
  })
})
