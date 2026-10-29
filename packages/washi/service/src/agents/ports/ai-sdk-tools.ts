import type { Member, Viewer } from '@washi/domain'
import type { Workspace } from '@washi/repository'
import { guardedFetch } from '@washi/tsuru'
import { tool } from 'ai'
import { z } from 'zod'
import { pageCapabilities, tableCapabilities } from '../../capabilities'
import { NOBODY } from '../../sheets/access'
import type { SearchKeyLookup } from '../lib'
import { webSearch } from '../search'
import { currentFetchPolicy } from '../tools'

/** Same surface the Claude port exposes — one capability set, two ports (§05). */
const READ_ONLY = new Set([
  'sheet_list',
  'sheet_get',
  'sheet_check',
  'sheet_backlinks',
  'search',
  'db_list_tables',
  'db_query',
  'db_history',
  'db_row_activity',
  'people_list',
  'set_conversation_title',
])

export function isReadTool(name: string): boolean {
  return READ_ONLY.has(name)
}

export interface AiToolDeps {
  ws: Workspace
  runHankoAction: (input: unknown) => Promise<void>
  openSheet?: (id: string) => void
  /** Who is on the team, for person cells — the control plane knows; the workspace file does not. */
  listPeople?: () => Promise<Member[]>
  searchKey?: SearchKeyLookup
  setTitle?: (title: string) => void
  /** Who asked: Washi reads the pages they can (D65). Absent is a routine — workspace pages. */
  viewer?: Viewer
}

/**
 * Approval is a stream-level concern in AI SDK 7 — the per-tool `needsApproval`
 * flag is deprecated. The port passes one `toolApproval` function and decides
 * there, using `isReadTool` below, so both ports gate on the same list.
 */
export function createAiTools({
  ws,
  runHankoAction,
  openSheet,
  listPeople,
  searchKey,
  setTitle,
  viewer,
}: AiToolDeps) {
  const shared = { viewer: viewer ?? NOBODY, author: 'washi', listPeople, onCreate: openSheet }
  const capabilities = [...pageCapabilities(ws, shared), ...tableCapabilities(ws, shared)]
  return {
    set_conversation_title: tool({
      description:
        'Name this conversation: at most four words, no quotes, no trailing period. Call once, at the start of your first reply.',
      inputSchema: z.object({ title: z.string().min(1).max(60) }),
      execute: async ({ title }) => {
        setTitle?.(title.trim())
        return { ok: true }
      },
    }),
    ...Object.fromEntries(
      capabilities.map((each) => [
        each.name,
        tool({
          description: each.description,
          inputSchema: z.object(each.input),
          execute: (input) => each.run(input),
        }),
      ]),
    ),
    fetch_url: tool({
      description: 'Fetch an https URL through the workspace fetch policy (tsuru).',
      inputSchema: z.object({ url: z.url() }),
      execute: async ({ url }) =>
        (await guardedFetch(url, currentFetchPolicy(ws))).slice(0, 100_000),
    }),
    web_search: tool({
      description:
        'Search the web through Exa: title, url, date and a short text per result. Read one in full with fetch_url.',
      inputSchema: z.object({
        query: z.string().min(1).max(400),
        count: z.number().int().min(1).max(10).optional(),
      }),
      execute: async ({ query, count }) => webSearch(searchKey, query, count),
    }),
    action_run: tool({
      description: 'Run a stamped hanko action: sheet.open, sheet.create, table.insert, url.open.',
      inputSchema: z.object({ action: z.record(z.string(), z.unknown()) }),
      execute: async ({ action }) => {
        await runHankoAction(action)
        return { ok: true }
      },
    }),
  }
}
