import type { McpChange } from './types'

export const SERVER_INFO = { name: 'washi', version: '0.1.0' }

/** Which writes move what an open page shows, by a capability's prefix; any other write, a page. */
export const CHANGES: Record<string, McpChange[]> = {
  sheet: ['page'],
  db: ['data', 'page'],
  comment: ['page'],
  reminder: ['data'],
}
export const DEFAULT_CHANGE: McpChange[] = ['page']

export const INSTRUCTIONS = `Washi is a team's knowledge base: pages written in WSX (JSX as data, a closed set of
primitives) and tables that work like Notion databases. You act as one member of one workspace:
you read what they can read, and every write lands as theirs, with its history.

Tables: db_list_tables shows each table's columns; db_query filters, sorts and groups rows;
db_mutate inserts, updates or deletes them; db_row_activity says who changed a row and when.
Pages: search or sheet_list, then sheet_get for the WSX source and its version; run sheet_check
before sheet_create or sheet_replace, and pass the version back as baseVersion so a teammate's
typing is merged, not overwritten. sheet_delete moves a page and its sub-pages to the Trash, only
when your person asks; they restore it from there. comment_add speaks on a page, or on a row by its
recordId.

Working a backlog kept in Washi: find the issues table (db_list_tables), query the open rows,
take one, comment on its row what you are doing and, when done, the pull request — then move its
status with db_mutate. Leave rows you did not touch alone.`
