import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import type { ChatAnchor } from '@washi/domain'
import {
  createSession,
  getSession,
  getTranscript,
  openWorkspace,
  type Workspace,
} from '@washi/repository'
import { ChatMoveError, movedFrom } from '../agents/handover'
import { AgentHost } from '../agents/host'
import type { AgentKeySource } from '../agents/lib'
import type { AgentPort } from '../agents/ports'
import { SheetNotFoundError } from '../sheets/access'
import { createSheetFromSource } from '../sheets/service'

let ws: Workspace
let host: AgentHost
let opened: { id: string; sessionId: string; handover?: boolean }[]
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  host = new AgentHost(ws)
  opened = []
  host.setEvents({
    update: () => {},
    approval: () => {},
    openSheet: (id, sessionId, handover) => opened.push({ id, sessionId, handover }),
  })
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

const ASK = 'Move this page to the trash'
const RIN = { id: 'rin', isOwner: false }
const KENJI = { id: 'kenji', isOwner: false }

const page = (title: string, props = '') =>
  createSheetFromSource(ws, {
    title,
    source: `<Sheet title="${title}"${props}><Text>x</Text></Sheet>`,
  })

const chatOn = (sheetId: string | null, createdBy: string | null = 'rin') =>
  createSession(ws, 'Trip', {
    createdBy,
    anchor: sheetId ? { sheetId, scope: 'page' } : null,
  })

describe('a conversation lives in a place, and can move (D110)', () => {
  test('a move re-anchors the chat and leaves a divider in its transcript', () => {
    const plan = page('Plan')
    const kyoto = page('Kyoto')
    const chat = chatOn(plan.id)

    const moved = host.moveSession(chat.id, kyoto.id, RIN)

    expect(moved?.anchor).toEqual({ sheetId: kyoto.id, scope: 'page' })
    expect(getTranscript(ws, chat.id).map((entry) => entry.update)).toEqual([
      { kind: 'handoff', from: plan.id, to: kyoto.id, title: 'Kyoto', by: 'person' },
    ])
    expect(opened).toEqual([])
  })

  test('Home is null, and a chat already there is no move', () => {
    const plan = page('Plan')
    const chat = chatOn(plan.id)
    host.moveSession(chat.id, null, RIN)
    expect(getSession(ws, chat.id)?.anchor).toBeNull()
    host.moveSession(chat.id, null, RIN)
    expect(getTranscript(ws, chat.id)).toHaveLength(1)
  })

  test('refuses a page the mover cannot read, and leaves the chat where it was', () => {
    const plan = page('Plan')
    const secret = page('Secret', ' visibility="private" access={["kenji"]}')
    const chat = chatOn(plan.id)
    expect(() => host.moveSession(chat.id, secret.id, RIN)).toThrow(SheetNotFoundError)
    expect(() => host.moveSession(chat.id, 'no-such-page', RIN)).toThrow(SheetNotFoundError)
    expect(getSession(ws, chat.id)?.anchor?.sheetId).toBe(plan.id)
    expect(getTranscript(ws, chat.id)).toEqual([])
  })

  test('refuses another member’s chat, and a workspace’s chat is nobody’s to move', () => {
    const kyoto = page('Kyoto')
    expect(() => host.moveSession(chatOn(null).id, kyoto.id, KENJI)).toThrow(ChatMoveError)
    expect(() => host.moveSession(chatOn(null, null).id, kyoto.id, RIN)).toThrow(ChatMoveError)
  })

  test('Washi’s handover sends only that chat’s person to the page', () => {
    const kyoto = page('Kyoto')
    const chat = chatOn(null)
    const handover = host['handover'].bind(host)
    expect(handover(chat.id, RIN, kyoto.id, 'the trip has its own page')).toEqual({
      ok: true,
      page: 'Kyoto',
    })
    expect(opened).toEqual([{ id: kyoto.id, sessionId: chat.id, handover: true }])
    expect(getTranscript(ws, chat.id).at(-1)?.update).toMatchObject({
      kind: 'handoff',
      by: 'washi',
      note: 'the trip has its own page',
    })
    expect(handover(chat.id, RIN, 'gone')).toMatchObject({ ok: false })
  })

  test('the page left behind names the newest chat still away from it', () => {
    const plan = page('Plan')
    const kyoto = page('Kyoto')
    const older = chatOn(plan.id)
    const newer = chatOn(plan.id)
    host.moveSession(older.id, kyoto.id, RIN)
    host.moveSession(newer.id, null, RIN)

    expect(movedFrom(ws, plan.id, RIN)).toMatchObject({ sessionId: newer.id, sheetId: null })
    expect(movedFrom(ws, plan.id, KENJI)).toBeNull()

    host.moveSession(newer.id, plan.id, RIN)
    expect(movedFrom(ws, plan.id, RIN)).toMatchObject({ sessionId: older.id, sheetId: kyoto.id })
  })
})

describe('the model is told the page its chat is on', () => {
  const asked = async (anchor: ChatAnchor | null, viewer = RIN) => {
    const said: string[] = []
    const port: AgentPort = {
      id: 'anthropic',
      prompt: async (request) => {
        said.push(request.text)
        return { costUsd: 0, billing: 'metered' }
      },
    }
    Object.assign(host, { claudePort: port, keys: KEY })
    const chat = createSession(ws, 'Here', { createdBy: viewer.id, anchor })
    await host.prompt(chat.id, ASK, { viewer })
    return said[0]
  }

  test('its title and id lead the ask, and a subtree says so', async () => {
    const plan = page('Plan')
    expect(await asked({ sheetId: plan.id, scope: 'page' })).toBe(
      `This conversation is on the page "Plan" (id ${plan.id}): "this page" means it.\n\n${ASK}`,
    )
    expect(await asked({ sheetId: plan.id, scope: 'subtree' })).toContain(
      `(id ${plan.id}) and the pages under it`,
    )
  })

  test('Home, a page gone, or one the asker cannot read is left unsaid', async () => {
    const secret = page('Secret', ' visibility="private" access={["kenji"]}')
    expect(await asked(null)).toBe(ASK)
    expect(await asked({ sheetId: 'gone', scope: 'page' })).toBe(ASK)
    expect(await asked({ sheetId: secret.id, scope: 'page' })).toBe(ASK)
    expect(await asked({ sheetId: secret.id, scope: 'page' }, KENJI)).toContain('"Secret"')
  })
})
