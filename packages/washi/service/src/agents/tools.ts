import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk'
import { linkColumnInputSchema, type Member, type Viewer } from '@washi/domain'
import { historyQuerySchema, tableSpecSchema } from '@washi/ink'
import { getAppMeta, listTables, type Workspace } from '@washi/repository'
import { fetchPolicySchema, guardedFetch } from '@washi/tsuru'
import { z } from 'zod'
import { NOBODY } from '../sheets/access'
import { checkSource, createSheetFromSource, updateSheetFromSource } from '../sheets/service'
import { runHistory } from '../tables/history'
import { linkColumn } from '../tables/link'
import { defineUserTable, runMutation, runQuery } from '../tables/service'
import type { SearchKeyLookup } from './lib'
import { pagesFor } from './lib/pages'
import { webSearch } from './search'

export const TSURU_HOSTS_KEY = 'tsuru_allowed_hosts'

export function currentFetchPolicy(ws: Workspace) {
  const stored = getAppMeta(ws, TSURU_HOSTS_KEY)
  return fetchPolicySchema.parse({ allowedHosts: stored ? JSON.parse(stored) : [] })
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
  /** Who asked: Washi reads the pages they can (D65). Absent is a routine — workspace pages. */
  viewer?: Viewer
}

/**
 * The complete capability surface of an embedded agent (spec §5). In-process
 * MCP server — zero IPC, every input zod-validated, nothing touches fs/shell.
 */
export function createWashiTools(ws: Workspace, context: ToolContext) {
  const pages = pagesFor(ws, context.viewer ?? NOBODY)
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
        'sheet_list',
        'List all sheets (id, title, icon, tags, parentId). A sheet with a parentId is a sub-page of that sheet.',
        {},
        async () => text(pages.list()),
      ),
      tool(
        'sheet_get',
        'Read one sheet: metadata, full WSX source, and its version (for sheet_replace).',
        { id: z.string() },
        async ({ id }) => text(pages.get(id)),
      ),
      tool(
        'sheet_check',
        'Validate WSX source without saving. Returns diagnostics — run before sheet_create/sheet_replace.',
        { source: z.string() },
        async ({ source }) => text(checkSource(source)),
      ),
      tool(
        'sheet_create',
        'Create a sheet from WSX source. The source must pass sheet_check. Pass parentId (from sheet_list) to file it under another sheet, as a sub-page.',
        {
          title: z.string().min(1).max(200),
          source: z.string(),
          parentId: z.string().optional(),
        },
        async ({ parentId, ...input }) => {
          if (parentId) pages.require(parentId)
          const sheet = createSheetFromSource(ws, input, parentId ?? null, 'washi')
          context.openSheet?.(sheet.id)
          return text(sheet)
        },
      ),
      tool(
        'sheet_replace',
        "Replace a sheet's WSX source (whole-document write). Pass the version sheet_get returned as baseVersion: a teammate typing in the page meanwhile is merged, not overwritten.",
        {
          id: z.string(),
          title: z.string().min(1).max(200),
          source: z.string(),
          baseVersion: z.string().optional(),
        },
        async ({ id, baseVersion, ...write }) => {
          pages.require(id)
          return text(updateSheetFromSource(ws, id, write, 'washi', baseVersion))
        },
      ),
      tool(
        'sheet_backlinks',
        'Sheets that reference the given sheet.',
        { id: z.string() },
        async ({ id }) => text(pages.backlinks(id)),
      ),
      tool('search', 'Full-text search across sheets.', { term: z.string() }, async ({ term }) =>
        text(pages.search(term)),
      ),
      tool(
        'people_list',
        'Who is on the team: { id, name } per member. A person cell holds the id.',
        {},
        async () => text((await context.listPeople?.()) ?? []),
      ),
      tool('db_list_tables', 'List user tables and their column specs.', {}, async () =>
        text(listTables(ws)),
      ),
      tool(
        'db_define',
        "Create or update a table — a database of rows, Notion-style. snake_case names. Column types: text, number, boolean, date (ISO, or start/end), select + options, multi_select + options, status + groups {todo, doing, done}, person (member id), url, relation + table (holds record ids), formula + expr — computed on every read from its own row, never written: month(date), usd * fx_rate, when(paid, false, days(now(), due) < 0); it reads the row’s columns and earlier formulas, no aggregates. Use one instead of a column you would fill by hand from other columns. rollup + rollup {table, via, fn, column?, where?, on?} — one aggregate over another table's rows that point at this row (via a relation holding its id, or a plain value equal to this row's `on`, default its first text column), never written: categories.spent = {table:'expenses', via:'category', fn:'sum', column:'amount', where:[{column:'month', op:'eq', value:{param:'month'}}]}; a query's params fill {param} (unset drops it); formulas may read rollups (left = budget - spent).",
        { spec: tableSpecSchema },
        async ({ spec }) => text(defineUserTable(ws, spec)),
      ),
      tool(
        'db_link_column',
        'Turn a text, select or multi_select column into a relation to another table: each value names the target row whose text column (on, default its first) reads the same, ignoring case and spaces, so renaming that row renames it everywhere and rollups match by id. create: true makes a target row for each value nothing matches; without it, unmatched values are refused and listed. Pages that filter the old column by name must then filter by id.',
        { input: linkColumnInputSchema },
        async ({ input }) => text(linkColumn(ws, input)),
      ),
      tool(
        'db_query',
        'Query a table: filters, orderBy, limit, groupBy aggregations (count/sum/avg/min/max).',
        { query: z.record(z.string(), z.unknown()) },
        async ({ query }) => {
          const { querySchema } = await import('@washi/ink')
          return text(runQuery(ws, querySchema.parse(query)))
        },
      ),
      tool(
        'db_history',
        'How many rows matched a filter at the close of each day, over 7d/14d/30d/90d: burn-ups, backlog over time, what shipped this month. Same where grammar as db_query.',
        { query: z.record(z.string(), z.unknown()) },
        async ({ query }) => text(runHistory(ws, historyQuerySchema.parse(query))),
      ),
      tool(
        'db_mutate',
        'Insert, update, or delete records: { kind, table, data?, where? }.',
        { mutation: z.record(z.string(), z.unknown()) },
        async ({ mutation }) => {
          const { mutationSchema } = await import('@washi/ink')
          return text(runMutation(ws, mutationSchema.parse(mutation)))
        },
      ),
      tool(
        'fetch_url',
        'Fetch an https URL through the workspace fetch policy (tsuru).',
        { url: z.url() },
        async ({ url }) => {
          const body = await guardedFetch(url, currentFetchPolicy(ws))
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
