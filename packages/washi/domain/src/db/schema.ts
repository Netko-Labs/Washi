import type { Filter } from '@washi/ink'
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
  /** Who wrote the content last: Washi, or null for a person. */
  editedBy: text('edited_by', { enum: ['washi'] }),
  /** The database row this page is the body of; such a page lives in its table, not the tree. */
  rowId: text('row_id'),
  /** Cache of `<Sheet visibility access>` (D65) — the source decides, lists filter on these. */
  visibility: text('visibility', { enum: ['private', 'shared', 'public'] })
    .notNull()
    .default('shared'),
  access: text('access', { mode: 'json' }).$type<string[]>().notNull().default([]),
  /** Derived cache of the Loro doc's text — queries and FTS read this. */
  source: text('source').notNull(),
  loroSnapshot: blob('loro_snapshot', { mode: 'buffer' }).notNull(),
  hlcCreated: text('hlc_created').notNull(),
  hlcUpdated: text('hlc_updated').notNull(),
  deletedAt: text('deleted_at'),
})

/** What a page held before each of Washi's writes since a person last wrote it — its undo stack. */
export const sheetRevisionTable = sqliteTable('sheet_revisions', {
  id: text('id').primaryKey(),
  sheetId: text('sheet_id').notNull(),
  title: text('title').notNull(),
  icon: text('icon'),
  source: text('source').notNull(),
  hlcCreated: text('hlc_created').notNull(),
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
  model: text('model'),
  effort: text('effort'),
  approvals: text('approvals'),
  createdBy: text('created_by'),
  anchorSheetId: text('anchor_sheet_id'),
  anchorScope: text('anchor_scope'),
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
  /** Before D68: YYYY-MM-DD of the last run. Read once to backfill `last_run_at`. */
  lastRunDay: text('last_run_day'),
  /** The latest run's chat. */
  sessionId: text('session_id'),
  createdBy: text('created_by'),
  createdAt: text('created_at').notNull(),
  cron: text('cron'),
  lastRunAt: text('last_run_at'),
})

/** One row per run; how it went is read off its chat (`agent_sessions`). */
export const routineRunTable = sqliteTable('routine_runs', {
  id: text('id').primaryKey(),
  routineId: text('routine_id').notNull(),
  sessionId: text('session_id').notNull(),
  trigger: text('trigger').notNull(),
  startedAt: text('started_at').notNull(),
})

/** A date rule the clock evaluates (D77): rows of `table` whose `date_column` comes due. No turn runs. */
export const reminderTable = sqliteTable('reminders', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  table: text('table_name').notNull(),
  dateColumn: text('date_column').notNull(),
  daysBefore: integer('days_before').notNull(),
  where: text('where_json', { mode: 'json' }).$type<Filter[]>().notNull(),
  personColumn: text('person_column'),
  timeZone: text('time_zone').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  createdBy: text('created_by'),
  createdAt: text('created_at').notNull(),
})

/** One row per row per due date; `recipient` null is everyone the workspace has. */
export const reminderHitTable = sqliteTable('reminder_hits', {
  id: text('id').primaryKey(),
  reminderId: text('reminder_id').notNull(),
  recordId: text('record_id').notNull(),
  dueDay: text('due_day').notNull(),
  rowTitle: text('row_title').notNull(),
  recipient: text('recipient'),
  hlcCreated: text('hlc_created').notNull(),
})

/** Who has seen a hit; an unread hit is one with no row here for that person. */
export const reminderReadTable = sqliteTable(
  'reminder_reads',
  {
    hitId: text('hit_id').notNull(),
    userId: text('user_id').notNull(),
    readAt: text('read_at').notNull(),
  },
  (table) => [primaryKey({ columns: [table.hitId, table.userId] })],
)

export const appMetaTable = sqliteTable('app_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})

/** A page's discussion: a thread is its first comment; replies point back at it. */
export const commentTable = sqliteTable('comments', {
  id: text('id').primaryKey(),
  sheetId: text('sheet_id').notNull(),
  threadId: text('thread_id').notNull(),
  authorId: text('author_id').notNull(),
  authorName: text('author_name').notNull(),
  body: text('body').notNull(),
  mentions: text('mentions', { mode: 'json' }).$type<{ id: string; name: string }[]>().notNull(),
  resolved: integer('resolved', { mode: 'boolean' }).notNull().default(false),
  hlcCreated: text('hlc_created').notNull(),
})

/** A file the workspace holds — an uploaded cover today. The bytes live beside the .db, or in a bucket. */
export const fileTable = sqliteTable('files', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  mime: text('mime').notNull(),
  size: integer('size').notNull(),
  hlcCreated: text('hlc_created').notNull(),
})

/** A workspace's own emoji: a `:shortcode:` over an upload. A purge never frees its file. */
export const customEmojiTable = sqliteTable('custom_emojis', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  fileId: text('file_id').notNull(),
  createdBy: text('created_by').notNull(),
  hlcCreated: text('hlc_created').notNull(),
})

/** An Unsplash photo a page picked: hotlinks and credit, so drawing a cover never asks Unsplash. */
export const unsplashPhotoTable = sqliteTable('unsplash_photos', {
  id: text('id').primaryKey(),
  regularUrl: text('regular_url').notNull(),
  fullUrl: text('full_url').notNull(),
  photographer: text('photographer').notNull(),
  profileUrl: text('profile_url').notNull(),
  pageUrl: text('page_url').notNull(),
  pickedBy: text('picked_by'),
  hlcPicked: text('hlc_picked').notNull(),
})

/** A page theme the workspace made: eight tokens per mode, stored as JSON. */
export const workspaceThemeTable = sqliteTable('workspace_themes', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  light: text('light').notNull(),
  dark: text('dark').notNull(),
  createdBy: text('created_by').notNull(),
  hlcCreated: text('hlc_created').notNull(),
  hlcUpdated: text('hlc_updated').notNull(),
})

/** One row per person mentioned: their Inbox, read or not. */
export const mentionInboxTable = sqliteTable(
  'mention_inbox',
  {
    userId: text('user_id').notNull(),
    commentId: text('comment_id').notNull(),
    sheetId: text('sheet_id').notNull(),
    readAt: text('read_at'),
  },
  (table) => [primaryKey({ columns: [table.userId, table.commentId] })],
)

/** A page's read-only link (D65): the token is the link; revoking stamps it, never deletes it. */
export const sheetShareTable = sqliteTable('sheet_shares', {
  token: text('token').primaryKey(),
  sheetId: text('sheet_id').notNull(),
  createdBy: text('created_by'),
  createdAt: text('created_at').notNull(),
  revokedAt: text('revoked_at'),
})
