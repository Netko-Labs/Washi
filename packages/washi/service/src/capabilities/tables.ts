import { linkColumnInputSchema, reminderAskSchema, rowActivityInputSchema } from '@washi/domain'
import { historyQuerySchema, mutationSchema, querySchema, tableSpecSchema } from '@washi/ink'
import { listTables, type Workspace } from '@washi/repository'
import { DB_MUTATE_DESCRIPTION } from '../agents/lib'
import { askReminder } from '../reminders/service'
import { rowActivity } from '../tables/activity'
import { runHistory } from '../tables/history'
import { linkColumn } from '../tables/link'
import { defineUserTable, runMutation, runQuery } from '../tables/service'
import { capability } from './define'
import type { Capability, CapabilityContext } from './types'

/** Tables as ink sees them: read as anyone in the workspace, every row write signed (P1). */
export function tableCapabilities(ws: Workspace, context: CapabilityContext): Capability[] {
  return [
    capability(
      'people_list',
      'Who is on the team: { id, name } per member. A person cell holds the id.',
      {},
      true,
      async () => (await context.listPeople?.()) ?? [],
    ),
    capability('db_list_tables', 'List user tables and their column specs.', {}, true, () =>
      listTables(ws),
    ),
    capability(
      'db_query',
      'Query a table: filters, orderBy, limit, groupBy aggregations (count/sum/avg/min/max).',
      { query: querySchema },
      true,
      ({ query }) => runQuery(ws, query),
    ),
    capability(
      'db_history',
      'How many rows matched a filter at the close of each day, over 7d/14d/30d/90d: burn-ups, backlog over time, what shipped this month. Same where grammar as db_query.',
      { query: historyQuerySchema },
      true,
      ({ query }) => runHistory(ws, query),
    ),
    capability(
      'db_row_activity',
      'When and by whom one row changed, newest first: each change\'s atMs, by (a member id from people_list, washi, or null for a change from before authors were kept), kind (created, edited, deleted) and fields [{ column, from, to }]. Answers "when was Water paid?" — find the row\'s id with db_query, then read the change whose fields set paid to true.',
      rowActivityInputSchema.shape,
      true,
      ({ recordId, limit }) => rowActivity(ws, recordId, limit),
    ),
    capability(
      'db_define',
      "Create or update a table — a database of rows, Notion-style. snake_case names. Column types: text, number, boolean, date (ISO, or start/end), select + options, multi_select + options, status + groups {todo, doing, done}, person (member id), url, relation + table (holds record ids), formula + expr — computed on every read from its own row, never written: month(date), usd * fx_rate, when(paid, false, days(now(), due) < 0); it reads the row’s columns and earlier formulas, no aggregates. Use one instead of a column you would fill by hand from other columns. rollup + rollup {table, via, fn, column?, where?, on?} — one aggregate over another table's rows that point at this row (via a relation holding its id, or a plain value equal to this row's `on`, default its first text column), never written: categories.spent = {table:'expenses', via:'category', fn:'sum', column:'amount', where:[{column:'month', op:'eq', value:{param:'month'}}]}; a query's params fill {param} (unset drops it); formulas may read rollups (left = budget - spent). A number, formula or rollup may take format: 'percent' (a ratio, 0.25 reads 25%) or a currency code ('USD', 'EUR') — set it on money and rates so every view reads them right.",
      { spec: tableSpecSchema },
      false,
      ({ spec }) => defineUserTable(ws, spec),
    ),
    capability(
      'db_link_column',
      'Turn a text, select or multi_select column into a relation to another table: each value names the target row whose text column (on, default its first) reads the same, ignoring case and spaces, so renaming that row renames it everywhere and rollups match by id. create: true makes a target row for each value nothing matches; without it, unmatched values are refused and listed. Pages that filter the old column by name must then filter by id.',
      { input: linkColumnInputSchema },
      false,
      ({ input }) => linkColumn(ws, input, context.author),
    ),
    capability(
      'db_mutate',
      DB_MUTATE_DESCRIPTION,
      { mutation: mutationSchema },
      false,
      ({ mutation }) => runMutation(ws, mutation, context.author),
    ),
    capability(
      'reminder_create',
      'Remind people before a date in a table comes due — bills to pay, deadlines, renewals, trips. Not a routine: no turn runs and nothing is spent. The server checks every minute and puts one Inbox row per table row per due date, from daysBefore (0–60) days ahead, for rows matching where (same grammar as db_query, e.g. paid = false). dateColumn must be a date column; personColumn (a person column) sends each row only to the member it names, otherwise everyone sees it. Use it whenever the ask is "remind me/us when … is due".',
      reminderAskSchema.shape,
      false,
      (ask) => askReminder(ws, ask, context.viewer.id),
    ),
  ]
}
