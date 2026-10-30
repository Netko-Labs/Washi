import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk'
import type { Member, Viewer } from '@washi/domain'
import { getAppMeta, type Workspace } from '@washi/repository'
import { fetchPolicySchema, guardedFetch } from '@washi/tsuru'
import { z } from 'zod'
import { pageCapabilities, tableCapabilities } from '../capabilities'
import { privateNetworkAllowed, serverPolicy } from '../server'
import { NOBODY } from '../sheets/access'
import { HANDOVER_DESCRIPTION, type SearchKeyLookup } from './lib'
import type { HandoverResult } from './ports/types'
import { webSearch } from './search'

export const TSURU_HOSTS_KEY = 'tsuru_allowed_hosts'

/** The hosts this workspace said "always" to, without the server's. */
export function ownFetchHosts(ws: Workspace): string[] {
  const stored = getAppMeta(ws, TSURU_HOSTS_KEY)
  return stored ? (JSON.parse(stored) as string[]) : []
}

/**
 * The workspace's hosts and the server's (D105), `*` among them meaning every public site, plus a
 * host one yes granted this fetch; what tsuru refuses outright stays refused, private ranges too
 * unless the server lifted that (D118).
 */
export function currentFetchPolicy(ws: Workspace, granted: string | null = null) {
  const hosts = new Set([...ownFetchHosts(ws), ...serverPolicy(ws).fetchHosts])
  if (granted) hosts.add(granted)
  return fetchPolicySchema.parse({
    allowedHosts: [...hosts],
    allowPrivate: privateNetworkAllowed(ws),
  })
}

/** `fetch_url` in both ports: the lists, plus the one host a yes granted this call. */
export function agentFetch(
  ws: Workspace,
  url: string,
  fetchGrant?: (url: string) => string | null,
) {
  return guardedFetch(url, currentFetchPolicy(ws, fetchGrant?.(url)))
}

function text(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] }
}

export interface ToolContext {
  runHankoAction: (input: unknown) => Promise<void>
  /** A page the agent just made is the page the person wants to look at. */
  openSheet?: (id: string) => void
  /** Who is on the team, for person cells — the control plane knows; the workspace file does not. */
  listPeople?: () => Promise<Member[]>
  /** The workspace's Exa key, resolved per call so a key set mid-session counts. */
  searchKey?: SearchKeyLookup
  /** Names the conversation — Washi calls it once, at the start of its first reply (D61). */
  setTitle?: (title: string) => void
  /** Moves the conversation to a page (D110). */
  handover?: (sheetId: string, note?: string) => HandoverResult
  /** Who asked: Washi reads the pages they can (D65). Absent is a routine — workspace pages. */
  viewer?: Viewer
  /** The off-list host the desk's yes let this fetch reach, taken once (`takeFetchGrant`). */
  fetchGrant?: (url: string) => string | null
}

/**
 * The complete capability surface of an embedded agent (spec §5). In-process
 * MCP server — zero IPC, every input zod-validated, nothing touches fs/shell.
 */
export function createWashiTools(ws: Workspace, context: ToolContext) {
  const shared = {
    viewer: context.viewer ?? NOBODY,
    author: 'washi',
    listPeople: context.listPeople,
    onCreate: context.openSheet,
  }
  const capabilities = [...pageCapabilities(ws, shared), ...tableCapabilities(ws, shared)]
  return createSdkMcpServer({
    name: 'washi',
    version: '0.1.0',
    tools: [
      tool(
        'set_conversation_title',
        'Name this conversation: at most four words, no quotes, no trailing period. Call once, at the start of your first reply.',
        { title: z.string().min(1).max(60) },
        async ({ title }) => {
          context.setTitle?.(title.trim())
          return text({ ok: true })
        },
      ),
      tool(
        'chat_handover',
        HANDOVER_DESCRIPTION,
        { sheetId: z.string().min(1), note: z.string().max(280).optional() },
        async ({ sheetId, note }) =>
          text(context.handover?.(sheetId, note) ?? { ok: false, reason: 'nowhere to move' }),
      ),
      ...capabilities.map((each) =>
        tool(each.name, each.description, each.input, async (input) => text(await each.run(input))),
      ),
      tool(
        'fetch_url',
        'Fetch an https URL through the workspace fetch policy (tsuru).',
        { url: z.url() },
        async ({ url }) => {
          const body = await agentFetch(ws, url, context.fetchGrant)
          return { content: [{ type: 'text' as const, text: body.slice(0, 100_000) }] }
        },
      ),
      tool(
        'web_search',
        'Search the web through Exa: title, url, date and a short text per result. Read one in full with fetch_url.',
        { query: z.string().min(1).max(400), count: z.number().int().min(1).max(10).optional() },
        async ({ query, count }) => text(await webSearch(context.searchKey, query, count)),
      ),
      tool(
        'action_run',
        'Run a stamped hanko action: sheet.open, sheet.create, table.insert, table.update, table.reorder, table.delete, url.open.',
        { action: z.record(z.string(), z.unknown()) },
        async ({ action }) => {
          await context.runHankoAction(action)
          return text({ ok: true })
        },
      ),
    ],
  })
}
