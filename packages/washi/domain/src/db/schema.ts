import { blob, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const sheetTable = sqliteTable('sheets', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  icon: text('icon'),
  tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default([]),
  parentId: text('parent_id'),
  /** Fractional key among siblings; backfilled at open, so never null in practice. */
  position: text('position').notNull(),
  /** A preset key from the host's cover palette; never a URL. */
  cover: text('cover'),
  fullWidth: integer('full_width', { mode: 'boolean' }).notNull().default(false),
  /** Derived cache of the Loro doc's text — queries and FTS read this. */
  source: text('source').notNull(),
  loroSnapshot: blob('loro_snapshot', { mode: 'buffer' }).notNull(),
  hlcCreated: text('hlc_created').notNull(),
  hlcUpdated: text('hlc_updated').notNull(),
  deletedAt: text('deleted_at'),
})

export const sheetLinkTable = sqliteTable(
  'sheet_links',
  {
    src: text('src').notNull(),
    dst: text('dst').notNull(),
  },
  (table) => [primaryKey({ columns: [table.src, table.dst] })],
)

export const userTableTable = sqliteTable('user_tables', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  /** ink TableSpec, validated before persist. */
  spec: text('spec', { mode: 'json' }).notNull(),
  hlcCreated: text('hlc_created').notNull(),
  hlcUpdated: text('hlc_updated').notNull(),
  deletedAt: text('deleted_at'),
})

export const recordTable = sqliteTable('records', {
  id: text('id').primaryKey(),
  tableId: text('table_id').notNull(),
  data: text('data', { mode: 'json' }).notNull(),
  hlcCreated: text('hlc_created').notNull(),
  hlcUpdated: text('hlc_updated').notNull(),
  deletedAt: text('deleted_at'),
})

export const agentSessionTable = sqliteTable('agent_sessions', {
  id: text('id').primaryKey(),
  provider: text('provider').notNull().default('claude'),
  title: text('title').notNull(),
  sdkSessionId: text('sdk_session_id'),
  status: text('status').notNull().default('idle'),
  costUsd: real('cost_usd').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const agentTurnTable = sqliteTable('agent_turns', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  seq: integer('seq').notNull(),
  /** One AgentUpdate JSON per row — the transcript is a replayable event log. */
  payload: text('payload', { mode: 'json' }).notNull(),
  createdAt: text('created_at').notNull(),
})

export const approvalTable = sqliteTable('approvals', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  toolName: text('tool_name').notNull(),
  input: text('input', { mode: 'json' }).notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: text('created_at').notNull(),
  resolvedAt: text('resolved_at'),
  /** The actor who answered. Null for embedded (one person) and for timeouts and stops. */
  resolvedBy: text('resolved_by'),
})

export const capabilityCallTable = sqliteTable('capability_calls', {
  id: text('id').primaryKey(),
  /** 'agent' or 'sheet' — which side of the desk the call came from. */
  origin: text('origin').notNull(),
  /** Who, once a workspace has more than one human. Null in embedded mode. */
  actorId: text('actor_id'),
  subject: text('subject').notNull(),
  input: text('input', { mode: 'json' }),
  decision: text('decision').notNull(),
  detail: text('detail'),
  createdAt: text('created_at').notNull(),
})

export const oplogTable = sqliteTable('oplog', {
  seq: integer('seq').primaryKey({ autoIncrement: true }),
  opId: text('op_id').notNull(),
  deviceId: text('device_id').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id').notNull(),
  op: text('op', { mode: 'json' }).notNull(),
})

/**
 * What the agent spent, per day, in this workspace. Activity rather than
 * identity, so it belongs beside the content (C1) and works in embedded mode
 * where there is no control plane at all.
 */
export const agentSpendTable = sqliteTable('agent_spend', {
  /** YYYY-MM-DD in UTC. One row per day; the cap is a day's worth. */
  day: text('day').primaryKey(),
  costUsd: real('cost_usd').notNull().default(0),
  /** Notional cost of turns a local Claude plan covered. Never counted against the cap. */
  savedUsd: real('saved_usd').notNull().default(0),
  turns: integer('turns').notNull().default(0),
  updatedAt: text('updated_at').notNull(),
})

export const routineTable = sqliteTable('routines', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  prompt: text('prompt').notNull(),
  /** Minutes after local midnight, on the wall clock of `timeZone`. */
  minuteOfDay: integer('minute_of_day').notNull(),
  /** IANA zone the person meant, so 07:00 stays 07:00 across daylight saving. */
  timeZone: text('time_zone').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  /** YYYY-MM-DD in `timeZone` of the last run, so a day runs at most once. */
  lastRunDay: text('last_run_day'),
  /** The conversation every run of this routine appends to. */
  sessionId: text('session_id'),
  createdBy: text('created_by'),
  createdAt: text('created_at').notNull(),
})

export const appMetaTable = sqliteTable('app_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})
