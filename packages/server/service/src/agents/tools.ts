import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk'
import {
  getAppMeta,
  getBacklinks,
  getSheet,
  listSheets,
  listTables,
  searchSheets,
  type Workspace,
} from '@washi/repository'
import { fetchPolicySchema, guardedFetch } from '@washi/tsuru'
import { z } from 'zod'
import { checkSource, createSheetFromSource, updateSheetFromSource } from '../sheets/service'
import { defineUserTable, runMutation, runQuery } from '../tables/service'

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
}

/**
 * The complete capability surface of an embedded agent (spec §5). In-process
 * MCP server — zero IPC, every input zod-validated, nothing touches fs/shell.
 */
export function createWashiTools(ws: Workspace, context: ToolContext) {
  return createSdkMcpServer({
    name: 'washi',
    version: '0.1.0',
    tools: [
      tool('sheet_list', 'List all sheets (id, title, icon, tags).', {}, async () =>
        text(listSheets(ws)),
      ),
      tool(
        'sheet_get',
        'Read one sheet: metadata + full WSX source.',
        { id: z.string() },
        async ({ id }) => text(getSheet(ws, id)),
      ),
      tool(
        'sheet_check',
        'Validate WSX source without saving. Returns diagnostics — run before sheet_create/sheet_replace.',
        { source: z.string() },
        async ({ source }) => text(checkSource(source)),
      ),
      tool(
        'sheet_create',
        'Create a sheet from WSX source. The source must pass sheet_check.',
        {
          title: z.string().min(1).max(200),
          icon: z.string().max(16).optional(),
          source: z.string(),
        },
        async (input) => {
          const sheet = createSheetFromSource(ws, input)
          context.openSheet?.(sheet.id)
          return text(sheet)
        },
      ),
      tool(
        'sheet_replace',
        "Replace a sheet's WSX source (whole-document write).",
        {
          id: z.string(),
          title: z.string().min(1).max(200),
          icon: z.string().max(16).optional(),
          source: z.string(),
        },
        async ({ id, ...write }) => text(updateSheetFromSource(ws, id, write)),
      ),
      tool(
        'sheet_backlinks',
        'Sheets that reference the given sheet.',
        { id: z.string() },
        async ({ id }) => text(getBacklinks(ws, id)),
      ),
      tool('search', 'Full-text search across sheets.', { term: z.string() }, async ({ term }) =>
        text(searchSheets(ws, term)),
      ),
      tool('db_list_tables', 'List user tables and their column specs.', {}, async () =>
        text(listTables(ws)),
      ),
      tool(
        'db_define',
        'Create or update a table definition (snake_case name, typed columns).',
        {
          spec: z.object({
            name: z.string(),
            columns: z.array(
              z.object({
                name: z.string(),
                type: z.enum(['text', 'number', 'boolean', 'date', 'select']),
                options: z.array(z.string()).optional(),
              }),
            ),
          }),
        },
        async ({ spec }) => text(defineUserTable(ws, spec)),
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
        'action_run',
        'Run a stamped hanko action: sheet.open, sheet.create, table.insert, url.open.',
        { action: z.record(z.string(), z.unknown()) },
        async ({ action }) => {
          await context.runHankoAction(action)
          return text({ ok: true })
        },
      ),
    ],
  })
}
