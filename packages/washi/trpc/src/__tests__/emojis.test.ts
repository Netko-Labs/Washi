import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  createFileStore,
  type FileStore,
  localBlobStore,
  openWorkspace,
  type Workspace,
} from '@washi/repository'
import { AgentHost, createSheetFromSource } from '@washi/service'
import {
  appRouter,
  type ControlPlane,
  createContext,
  createEventBus,
  createPresenceBoard,
  type ServerRuntime,
} from '../index'

const WORKSPACE = 'w1'

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
let files: FileStore
let runtime: ServerRuntime
beforeEach(() => {
  ws = openWorkspace({ id: WORKSPACE, path: ':memory:' })
  const host = new AgentHost(ws)
  files = createFileStore(ws, localBlobStore(mkdtempSync(join(tmpdir(), 'washi-emoji-'))))
  runtime = {
    mode: 'hosted',
    events: createEventBus(),
    resolve: () => ({ workspace: ws, host, files }),
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

const upload = () =>
  files.put({ name: 'fox.png', mime: 'image/png', bytes: new Uint8Array([1, 2, 3]) })

describe('emojis', () => {
  test('a name is a lowercase shortcode; a taken one is refused in words', async () => {
    const member = callerFor('member')
    const { id: fileId } = await upload()
    const fox = await member.emojis.add({ name: ':Party-Fox:', fileId })
    expect(fox).toMatchObject({ name: 'party-fox', fileId, createdBy: 'member' })
    await expect(member.emojis.add({ name: 'party-fox', fileId })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'there is already an emoji called :party-fox:',
    })
    await expect(member.emojis.add({ name: 'no spaces', fileId })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    })
    expect((await member.emojis.list()).map((emoji) => emoji.name)).toEqual(['party-fox'])
  })

  test('the picture must already be in the workspace', async () => {
    await expect(
      callerFor('member').emojis.add({ name: 'ghost', fileId: 'nowhere' }),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'that picture is not in this workspace',
    })
  })

  test('its adder or an owner removes it; another member may not', async () => {
    const { id: fileId } = await upload()
    const fox = await callerFor('ana').emojis.add({ name: 'fox', fileId })
    await expect(callerFor('ben').emojis.remove({ id: fox.id })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    })
    await callerFor('owner').emojis.remove({ id: fox.id })
    expect(await callerFor('ana').emojis.list()).toEqual([])
    expect(files.info(fileId)).toBeNull()
  })

  test('removing an emoji keeps the picture a page still wears', async () => {
    const { id: fileId } = await upload()
    const ana = callerFor('ana')
    const fox = await ana.emojis.add({ name: 'fox', fileId })
    createSheetFromSource(ws, {
      title: 'Den',
      source: `<Sheet title="Den" icon="file:${fileId}"><Text>den</Text></Sheet>`,
    })
    await ana.emojis.remove({ id: fox.id })
    expect(files.info(fileId)).not.toBeNull()
  })
})
