import { mutationSchema, querySchema, tableSpecSchema } from '@washi/ink'
import {
  getBacklinks,
  getSheet,
  listSheets,
  listTables,
  searchSheets,
  type Workspace,
} from '@washi/repository'
import { guardedFetch } from '@washi/tsuru'
import { tool } from 'ai'
import { z } from 'zod'
import { checkSource, createSheetFromSource, updateSheetFromSource } from '../../sheets/service'
import { defineUserTable, runMutation, runQuery } from '../../tables/service'
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
])

export function isReadTool(name: string): boolean {
  return READ_ONLY.has(name)
}

export interface AiToolDeps {
  ws: Workspace
  runHankoAction: (input: unknown) => Promise<void>
  openSheet?: (id: string) => void
}

/**
 * Approval is a stream-level concern in AI SDK 7 — the per-tool `needsApproval`
 * flag is deprecated. The port passes one `toolApproval` function and decides
 * there, using `isReadTool` below, so both ports gate on the same list.
 */
export function createAiTools({ ws, runHankoAction, openSheet }: AiToolDeps) {
  return {
    sheet_list: tool({
      description:
        'List all sheets (id, title, icon, tags, parentId). A sheet with a parentId is a sub-page of that sheet.',
      inputSchema: z.object({}),
      execute: async () => listSheets(ws),
    }),
    sheet_get: tool({
      description: 'Read one sheet: metadata + full WSX source.',
      inputSchema: z.object({ id: z.string() }),
      execute: async ({ id }) => getSheet(ws, id),
    }),
    sheet_check: tool({
      description: 'Validate WSX without saving. Run before sheet_create or sheet_replace.',
      inputSchema: z.object({ source: z.string() }),
      execute: async ({ source }) => checkSource(source),
    }),
    sheet_backlinks: tool({
      description: 'Sheets that reference the given sheet.',
      inputSchema: z.object({ id: z.string() }),
      execute: async ({ id }) => getBacklinks(ws, id),
    }),
    search: tool({
      description: 'Full-text search across sheets.',
      inputSchema: z.object({ term: z.string() }),
      execute: async ({ term }) => searchSheets(ws, term),
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

    sheet_create: tool({
      description:
        'Create a sheet from WSX source. It must pass sheet_check. Pass parentId (from sheet_list) to file it under another sheet, as a sub-page.',
      inputSchema: z.object({
        title: z.string().min(1).max(200),
        icon: z.string().max(16).optional(),
        source: z.string(),
        parentId: z.string().optional(),
      }),
      execute: async ({ parentId, ...input }) => {
        const sheet = createSheetFromSource(ws, input, parentId ?? null, 'washi')
        openSheet?.(sheet.id)
        return sheet
      },
    }),
    sheet_replace: tool({
      description: "Replace a sheet's WSX source (whole-document write).",
      inputSchema: z.object({
        id: z.string(),
        title: z.string().min(1).max(200),
        icon: z.string().max(16).optional(),
        source: z.string(),
      }),
      execute: async ({ id, ...write }) => updateSheetFromSource(ws, id, write, 'washi'),
    }),
    db_define: tool({
      description:
        'Create or update a table — a database of rows, Notion-style. Column types: text, number, boolean, date (ISO, or start/end), select + options, multi_select + options, status + groups {todo, doing, done}, person (member id), url, relation + table (holds record ids).',
      inputSchema: z.object({ spec: tableSpecSchema }),
      execute: async ({ spec }) => defineUserTable(ws, spec),
    }),
    db_mutate: tool({
      description: 'Insert, update, or delete records.',
      inputSchema: z.object({ mutation: mutationSchema }),
      execute: async ({ mutation }) => runMutation(ws, mutation),
    }),
    fetch_url: tool({
      description: 'Fetch an https URL through the workspace fetch policy (tsuru).',
      inputSchema: z.object({ url: z.url() }),
      execute: async ({ url }) =>
        (await guardedFetch(url, currentFetchPolicy(ws))).slice(0, 100_000),
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
