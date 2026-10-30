import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  createFileStore,
  listCapabilityCalls,
  localBlobStore,
  openWorkspace,
  type Workspace,
} from '@washi/repository'
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

const control: ControlPlane = {
  authenticate: async () => null,
  authorize: async () => true,
  listWorkspaces: async () => [{ id: WORKSPACE, name: 'Team', role: 'member' }],
  listMembers: async () => [],
  workspaceIds: async () => [WORKSPACE],
  handle: async () => null,
  close: async () => {},
}

const PHOTO = {
  id: 'Dwu85P9SOIk',
  alt_description: 'a fjord at dawn',
  urls: {
    full: 'https://images.unsplash.com/photo-1?q=85',
    regular: 'https://images.unsplash.com/photo-1?w=1080',
    small: 'https://images.unsplash.com/photo-1?w=400',
    thumb: 'https://images.unsplash.com/photo-1?w=200',
  },
  links: {
    html: 'https://unsplash.com/photos/Dwu85P9SOIk',
    download_location: 'https://api.unsplash.com/photos/Dwu85P9SOIk/download?ixid=abc',
  },
  user: { name: 'Ansel Adams', links: { html: 'https://unsplash.com/@ansel' } },
}

let ws: Workspace
let key: string | null
const runtimeOf = (): ServerRuntime => {
  const host = new AgentHost(ws)
  const files = createFileStore(ws, localBlobStore(mkdtempSync(join(tmpdir(), 'washi-unsplash-'))))
  return {
    mode: 'hosted',
    events: createEventBus(),
    resolve: () => ({ workspace: ws, host, files }),
    control,
    defaultWorkspaceId: WORKSPACE,
    presence: createPresenceBoard(() => {}),
    unsplashKey: async () => key,
  }
}
beforeEach(() => {
  ws = openWorkspace({ id: WORKSPACE, path: ':memory:' })
  key = null
})
afterEach(() => ws.close())

const caller = () =>
  appRouter.createCaller(
    createContext(runtimeOf(), {
      workspaceId: WORKSPACE,
      actor: { id: 'ana', email: 'ana@x', name: 'Ana' },
    }),
  )

describe('unsplash (D117)', () => {
  test('without a key nothing leaves, and the refusal says where one goes', async () => {
    const fetched = spyOn(globalThis, 'fetch')
    expect(await caller().unsplash.status()).toEqual({ ready: false })
    await expect(caller().unsplash.search({ query: 'fjord' })).rejects.toMatchObject({
      code: 'PRECONDITION_FAILED',
      message: expect.stringContaining('Settings → Washi → What leaves'),
    })
    expect(fetched).not.toHaveBeenCalled()
    fetched.mockRestore()
  })

  test('a pick reads the photo again, counts the download and keeps its credit', async () => {
    key = 'access-key-1'
    const seen: string[] = []
    const fetched = spyOn(globalThis, 'fetch').mockImplementation((async (url: string) => {
      seen.push(url)
      return new Response(JSON.stringify(url.includes('/download') ? {} : PHOTO))
    }) as unknown as typeof fetch)

    expect(await caller().unsplash.status()).toEqual({ ready: true })
    const kept = await caller().unsplash.use({ id: PHOTO.id })
    expect(seen).toEqual([
      'https://api.unsplash.com/photos/Dwu85P9SOIk',
      PHOTO.links.download_location,
    ])
    expect(kept).toMatchObject({
      id: PHOTO.id,
      regularUrl: PHOTO.urls.regular,
      photographer: 'Ansel Adams',
      pickedBy: 'ana',
      alt: 'a fjord at dawn',
    })
    expect(await caller().unsplash.photos()).toHaveLength(1)
    const [ledger] = listCapabilityCalls(ws)
    expect(ledger).toMatchObject({ subject: 'unsplash_use', decision: 'auto', actorId: 'ana' })
    fetched.mockRestore()
  })

  test('a refused key is ledgered as denied and kept nothing', async () => {
    key = 'access-key-1'
    const fetched = spyOn(globalThis, 'fetch').mockImplementation(
      (async () => new Response('{}', { status: 401 })) as unknown as typeof fetch,
    )
    await expect(caller().unsplash.use({ id: PHOTO.id })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    })
    expect(await caller().unsplash.photos()).toEqual([])
    expect(listCapabilityCalls(ws)[0]).toMatchObject({
      subject: 'unsplash_use',
      decision: 'denied',
    })
    fetched.mockRestore()
  })
})
