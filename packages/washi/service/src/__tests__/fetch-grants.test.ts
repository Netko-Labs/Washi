import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { type ServerPolicy, serverPolicySchema } from '@washi/domain'
import {
  createSession,
  listCapabilityCalls,
  openWorkspace,
  type Workspace,
} from '@washi/repository'
import { ApprovalDesk } from '../agents/approvals'
import { CapabilityDesk } from '../agents/desk'
import { AgentHost } from '../agents/host'
import { createAiTools } from '../agents/ports/ai-sdk-tools'
import { agentFetch } from '../agents/tools'
import { lendServerPolicy } from '../server'

const URL_OFF_LIST = 'https://example.com/a'

let ws: Workspace
let desk: ApprovalDesk
let session: string
let policy: ServerPolicy
let fetched: string[]
const realFetch = globalThis.fetch

beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  policy = serverPolicySchema.parse({})
  lendServerPolicy(ws, () => policy)
  desk = new ApprovalDesk(ws, () => null, new CapabilityDesk(ws, () => null))
  session = createSession(ws, 'Mine', { createdBy: 'ana' }).id
  fetched = []
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input instanceof Request ? input.url : input)
    fetched.push(url)
    if (url.includes('/hop')) {
      return new Response(null, { status: 302, headers: { location: 'https://elsewhere.dev/' } })
    }
    return new Response('hello')
  }) as typeof fetch
})
afterEach(() => {
  globalThis.fetch = realFetch
  desk.dropSession(session)
  ws.close()
})

const within = (promise: Promise<boolean>) =>
  Promise.race([promise, new Promise<'waiting'>((done) => setTimeout(() => done('waiting'), 10))])
const grant = (url: string) => desk.takeFetchGrant(session, url)

/** A person answers the one question on the desk. */
async function answer(url: string, decision: 'allow_once' | 'reject_once') {
  const asked = desk.approve(session, 'fetch_url', { url })
  await Bun.sleep(1)
  const [request] = desk.list()
  if (!request) throw new Error('nothing asked')
  desk.resolve(request.id, decision, 'ana')
  return asked
}

describe('an approved fetch reaches its host, once (D118)', () => {
  test('unapproved, an off-list host is refused by tsuru', async () => {
    await expect(agentFetch(ws, URL_OFF_LIST, grant)).rejects.toThrow('not on the allowlist')
  })

  test('allow once fetches once; the next fetch asks again', async () => {
    expect(await answer(URL_OFF_LIST, 'allow_once')).toBe(true)
    expect(await agentFetch(ws, URL_OFF_LIST, grant)).toBe('hello')
    await expect(agentFetch(ws, URL_OFF_LIST, grant)).rejects.toThrow('not on the allowlist')
    expect(await within(desk.approve(session, 'fetch_url', { url: URL_OFF_LIST }))).toBe('waiting')
  })

  test('a no grants nothing', async () => {
    expect(await answer(URL_OFF_LIST, 'reject_once')).toBe(false)
    expect(desk.takeFetchGrant(session, URL_OFF_LIST)).toBeNull()
  })

  test('the grant is the one host: a redirect elsewhere is checked again and refused', async () => {
    const hop = 'https://example.com/hop'
    expect(await answer(hop, 'allow_once')).toBe(true)
    await expect(agentFetch(ws, hop, grant)).rejects.toThrow(
      '"elsewhere.dev" is not on the allowlist',
    )
  })

  test('the AI SDK port’s fetch_url takes the grant too', async () => {
    const tools = createAiTools({ ws, runHankoAction: async () => {}, fetchGrant: grant })
    expect(await answer(URL_OFF_LIST, 'allow_once')).toBe(true)
    const run = tools.fetch_url.execute
    if (!run) throw new Error('fetch_url has no execute')
    expect(await run({ url: URL_OFF_LIST }, { toolCallId: 't', messages: [], context: {} })).toBe(
      'hello',
    )
  })
})

describe('a standing yes grants the fetch it passes', () => {
  test('a YOLO conversation: fetched, ledgered auto by its starter', async () => {
    const host = new AgentHost(ws)
    host.setYoloAllowed(true)
    host.setSessionOptions(session, { approvals: 'auto' }, 'ana')
    expect(await within(desk.approve(session, 'fetch_url', { url: URL_OFF_LIST }))).toBe(true)
    expect(await agentFetch(ws, URL_OFF_LIST, grant)).toBe('hello')
    const [latest] = listCapabilityCalls(ws, 1)
    expect(latest).toMatchObject({ subject: 'fetch_url', decision: 'auto', actorId: 'ana' })
  })

  test('a workspace on auto', async () => {
    desk.setMode('auto')
    expect(await within(desk.approve(session, 'fetch_url', { url: URL_OFF_LIST }))).toBe(true)
    expect(await agentFetch(ws, URL_OFF_LIST, grant)).toBe('hello')
    expect(listCapabilityCalls(ws, 1)[0]).toMatchObject({ decision: 'auto' })
  })

  test('the server’s desk switch', async () => {
    policy = { ...policy, safeguards: { ...policy.safeguards, approveAll: true } }
    expect(await within(desk.approve(session, 'fetch_url', { url: URL_OFF_LIST }))).toBe(true)
    expect(await agentFetch(ws, URL_OFF_LIST, grant)).toBe('hello')
    expect(listCapabilityCalls(ws, 1)[0]).toMatchObject({ decision: 'auto', detail: 'server' })
  })
})

describe('what tsuru refuses stays refused', () => {
  test('a private address: no yes, and a grant for it still does not pass', async () => {
    desk.setMode('auto')
    const inside = 'https://10.0.0.1/'
    expect(await within(desk.approve(session, 'fetch_url', { url: inside }))).toBe(false)
    expect(desk.takeFetchGrant(session, inside)).toBeNull()
    await expect(agentFetch(ws, inside, () => '10.0.0.1')).rejects.toThrow('private')
    expect(fetched).toEqual([])
  })

  test('with the private network lifted, a yes reaches the private host it named', async () => {
    policy = { ...policy, safeguards: { ...policy.safeguards, privateNetwork: true } }
    desk.setMode('auto')
    const inside = 'https://10.0.0.1/'
    expect(await within(desk.approve(session, 'fetch_url', { url: inside }))).toBe(true)
    expect(await agentFetch(ws, inside, grant)).toBe('hello')
  })

  test('grants die with the turn', async () => {
    desk.setMode('auto')
    expect(await within(desk.approve(session, 'fetch_url', { url: URL_OFF_LIST }))).toBe(true)
    desk.dropSession(session)
    await expect(agentFetch(ws, URL_OFF_LIST, grant)).rejects.toThrow('not on the allowlist')
  })
})
