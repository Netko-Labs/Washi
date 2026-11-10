import { afterEach, describe, expect, test } from 'bun:test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { openWorkspace, type Workspace } from '@washi/repository'
import { workspaceLook } from '@washi/service'
import { answerMcp } from '../server'

const MEMBER = { id: 'u-juan', name: 'Juan' }

let ws: Workspace
let client: Client

async function connect(isSteward: boolean) {
  ws = openWorkspace({ id: 'themes', path: ':memory:' })
  const session = {
    ws,
    viewer: { id: MEMBER.id, isOwner: false },
    isSteward,
    member: MEMBER,
    listPeople: async () => [MEMBER],
    changed: () => {},
  }
  const fetch = (input: string | URL | Request, init?: RequestInit) =>
    answerMcp(
      input instanceof Request ? new Request(input, init) : new Request(String(input), init),
      session,
    )
  client = new Client({ name: 'test-agent', version: '1.0.0' })
  await client.connect(
    new StreamableHTTPClientTransport(new URL('http://washi.test/mcp/themes'), { fetch }),
  )
}

afterEach(async () => {
  await client.close()
  ws.close()
})

const call = async (name: string, args: Record<string, unknown> = {}) => {
  const result = await client.callTool({ name, arguments: args })
  const [first] = result.content as { text: string }[]
  return { isError: Boolean(result.isError), value: JSON.parse(first?.text ?? 'null') }
}

/** mirin's brand, as the tool's own example writes it — amber-700 for words on light paper. */
const MIRIN = {
  slug: 'mirin',
  name: 'mirin',
  light: {
    bg: '#f7f4ec',
    card: '#fffdf8',
    ink: '#14100c',
    muted: '#6b5f52',
    border: '#e4dccd',
    mutedBg: '#efe8da',
    accent: '#8a4b12',
    accentInk: '#ffffff',
  },
  dark: {
    bg: '#14100c',
    card: '#1d1813',
    ink: '#f7f4ec',
    muted: '#b3a796',
    border: '#3a3128',
    mutedBg: '#251f18',
    accent: '#dd9a3f',
    accentInk: '#14100c',
  },
}

describe('a workspace’s brand over MCP (D139)', () => {
  test('theme_define makes ws:<slug>, changes it in place, reads any colour and refuses in words', async () => {
    await connect(false)
    const made = await call('theme_define', MIRIN)
    expect(made.value).toMatchObject({ key: 'ws:mirin', created: true, warnings: [] })
    expect(made.value.light.accent).toBe('#8A4B12')

    const changed = await call('theme_define', {
      ...MIRIN,
      name: 'mirin amber',
      dark: { ...MIRIN.dark, accent: 'oklch(0.74 0.12 66)', card: 'hsl(30 21% 9%)' },
    })
    expect(changed.value).toMatchObject({ key: 'ws:mirin', created: false, name: 'mirin amber' })
    expect(changed.value.dark.accent).toMatch(/^#[0-9A-F]{6}$/)

    const unreadable = await call('theme_define', {
      ...MIRIN,
      slug: 'pale',
      name: 'Pale',
      light: { ...MIRIN.light, accent: '#dd9a3f' },
    })
    expect(unreadable.isError).toBe(true)
    expect(String(unreadable.value)).toContain('Accent on a card is 2.4:1 in light')

    const clash = await call('theme_define', { ...MIRIN, slug: 'other', name: 'MIRIN AMBER' })
    expect(String(clash.value)).toContain('already has a theme named “mirin amber”')

    const notAColour = await call('theme_define', {
      ...MIRIN,
      slug: 'odd',
      name: 'Odd',
      light: { ...MIRIN.light, ink: 'var(--ink)' },
    })
    expect(String(notAColour.value)).toContain('light.ink "var(--ink)" is not a colour')

    const catalog = await call('catalog_list')
    expect(catalog.value.themes).toContain('ws:mirin')
    expect(catalog.value.workspaceThemes[0]).toMatchObject({ key: 'ws:mirin', name: 'mirin amber' })
    expect(catalog.value.workspaceLook).toEqual({ icon: null, cover: null })
  })

  test('workspace_look_set is a steward’s: set, read back, a miss named', async () => {
    await connect(true)
    const set = await call('workspace_look_set', { icon: 'rocket', cover: 'preset:paper' })
    expect(set.value).toEqual({ icon: 'rocket', cover: 'preset:paper' })
    expect(workspaceLook(ws)).toEqual({ icon: 'rocket', cover: 'preset:paper' })
    expect((await call('workspace_look_set')).value).toEqual(set.value)
    expect((await call('workspace_look_set', { cover: null })).value).toEqual({
      icon: 'rocket',
      cover: null,
    })
    const miss = await call('workspace_look_set', { icon: 'rockt' })
    expect(miss.isError).toBe(true)
    expect(String(miss.value)).toContain('did you mean rocket')
  })

  test('a member who is no owner or admin is told who can change the default look', async () => {
    await connect(false)
    const refused = await call('workspace_look_set', { icon: 'rocket' })
    expect(refused.isError).toBe(true)
    expect(String(refused.value)).toContain('only a workspace owner or admin')
    expect(workspaceLook(ws)).toEqual({ icon: null, cover: null })
  })
})
