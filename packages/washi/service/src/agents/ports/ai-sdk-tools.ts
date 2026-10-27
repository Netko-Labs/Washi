import { linkColumnInputSchema, type Member, type Viewer } from '@washi/domain'
import { historyQuerySchema, mutationSchema, querySchema, tableSpecSchema } from '@washi/ink'
import { listTables, type Workspace } from '@washi/repository'
import { guardedFetch } from '@washi/tsuru'
import { tool } from 'ai'
import { z } from 'zod'
import { NOBODY } from '../../sheets/access'
import { checkSource, createSheetFromSource, updateSheetFromSource } from '../../sheets/service'
import { runHistory } from '../../tables/history'
import { linkColumn } from '../../tables/link'
import { defineUserTable, runMutation, runQuery } from '../../tables/service'
import { DB_MUTATE_DESCRIPTION, type SearchKeyLookup } from '../lib'
import { pagesFor } from '../lib/pages'
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
  const pages = pagesFor(ws, viewer ?? NOBODY)
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
    sheet_list: tool({
      description:
        'List all sheets (id, title, icon, tags, parentId). A sheet with a parentId is a sub-page of that sheet.',
      inputSchema: z.object({}),
      execute: async () => pages.list(),
    }),
    sheet_get: tool({
      description:
        'Read one sheet: metadata, full WSX source, and its version (for sheet_replace).',
      inputSchema: z.object({ id: z.string() }),
      execute: async ({ id }) => pages.get(id),
    }),
    sheet_check: tool({
      description: 'Validate WSX without saving. Run before sheet_create or sheet_replace.',
      inputSchema: z.object({ source: z.string() }),
      execute: async ({ source }) => checkSource(source),
    }),
    sheet_backlinks: tool({
      description: 'Sheets that reference the given sheet.',
      inputSchema: z.object({ id: z.string() }),
      execute: async ({ id }) => pages.backlinks(id),
    }),
    search: tool({
      description: 'Full-text search across sheets.',
      inputSchema: z.object({ term: z.string() }),
      execute: async ({ term }) => pages.search(term),
    }),
    people_list: tool({
      description: 'Who is on the team: { id, name } per member. A person cell holds the id.',
      inputSchema: z.object({}),
      execute: async () => (await listPeople?.()) ?? [],
    }),
    db_list_tables: tool({
      description: 'List user tables and their column specs.',
      inputSchema: z.object({}),
      execute: async () => listTables(ws),
    }),
    db_query: tool({
      description: 'Query a table: filters, orderBy, limit, groupBy aggregations.',
      inputSchema: z.object({ query: querySchema }),
      execute: async ({ query }) => runQuery(ws, query),
    }),
    db_history: tool({
      description:
        'How many rows matched a filter at the close of each day, over 7d/14d/30d/90d: burn-ups, backlog over time, what shipped this month. Same where grammar as db_query.',
      inputSchema: z.object({ query: historyQuerySchema }),
      execute: async ({ query }) => runHistory(ws, query),
    }),

    sheet_create: tool({
      description:
        'Create a sheet from WSX source. It must pass sheet_check. Pass parentId (from sheet_list) to file it under another sheet, as a sub-page.',
      inputSchema: z.object({
        title: z.string().min(1).max(200),
        source: z.string(),
        parentId: z.string().optional(),
      }),
      execute: async ({ parentId, ...input }) => {
        if (parentId) pages.require(parentId)
        const sheet = createSheetFromSource(ws, input, parentId ?? null, 'washi')
        openSheet?.(sheet.id)
        return sheet
      },
    }),
    sheet_replace: tool({
      description:
        "Replace a sheet's WSX source (whole-document write). Pass the version sheet_get returned as baseVersion: a teammate typing in the page meanwhile is merged, not overwritten.",
      inputSchema: z.object({
        id: z.string(),
        title: z.string().min(1).max(200),
        source: z.string(),
        baseVersion: z.string().optional(),
      }),
      execute: async ({ id, baseVersion, ...write }) => {
        pages.require(id)
        return updateSheetFromSource(ws, id, write, 'washi', baseVersion)
      },
    }),
    db_define: tool({
      description:
        "Create or update a table — a database of rows, Notion-style. Column types: text, number, boolean, date (ISO, or start/end), select + options, multi_select + options, status + groups {todo, doing, done}, person (member id), url, relation + table (holds record ids), formula + expr — computed on every read from its own row, never written: month(date), usd * fx_rate, when(paid, false, days(now(), due) < 0); it reads the row’s columns and earlier formulas, no aggregates. Use one instead of a column you would fill by hand from other columns. rollup + rollup {table, via, fn, column?, where?, on?} — one aggregate over another table's rows that point at this row (via a relation holding its id, or a plain value equal to this row's `on`, default its first text column), never written: categories.spent = {table:'expenses', via:'category', fn:'sum', column:'amount', where:[{column:'month', op:'eq', value:{param:'month'}}]}; a query's params fill {param} (unset drops it); formulas may read rollups (left = budget - spent).",
      inputSchema: z.object({ spec: tableSpecSchema }),
      execute: async ({ spec }) => defineUserTable(ws, spec),
    }),
    db_link_column: tool({
      description:
        'Turn a text, select or multi_select column into a relation to another table: each value names the target row whose text column (on, default its first) reads the same, ignoring case and spaces, so renaming that row renames it everywhere and rollups match by id. create: true makes a target row for each value nothing matches; without it, unmatched values are refused and listed. Pages that filter the old column by name must then filter by id.',
      inputSchema: z.object({ input: linkColumnInputSchema }),
      execute: async ({ input }) => linkColumn(ws, input),
    }),
    db_mutate: tool({
      description: DB_MUTATE_DESCRIPTION,
      inputSchema: z.object({ mutation: mutationSchema }),
      execute: async ({ mutation }) => runMutation(ws, mutation),
    }),
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
