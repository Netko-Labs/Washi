import type { McpChange } from './types'

export const SERVER_INFO = { name: 'washi', version: '0.1.0' }

/** Which writes move what an open page shows, by a capability's prefix; any other write, a page. */
export const CHANGES: Record<string, McpChange[]> = {
  sheet: ['page'],
  db: ['data', 'page'],
  comment: ['page'],
  reminder: ['data'],
  // An upload changes nothing on screen until a page wears it.
  file: [],
}
export const DEFAULT_CHANGE: McpChange[] = ['page']

export const INSTRUCTIONS = `Washi is a team's knowledge base: pages written in WSX (JSX as data, a closed set of
primitives) and tables that work like Notion databases. You act as one member of one workspace:
you read what they can read, and every write lands as theirs, with its history.

Writing pages: call wsx_reference first — every primitive with its props, and the rules for text
(inline **strong** *em* \`code\` [links](https://…), escaping { } < > as {"…"}, a markdown table as
<Table columns rows />, page links with <Ref>, <PageLink> and a live <Subpages />). Ask it for a few
primitives by name to get their props and an example. catalog_list names every icon, cover and
theme a <Sheet> may wear; file_upload turns a picture into a file:<id> key for an icon or a cover.
Run sheet_check (preview: true shows the words it draws) before sheet_create or sheet_replace.
Writes answer { id, title, version } — pass that version back as baseVersion on your next write so a
teammate's typing is merged, not overwritten. To change a few lines, sheet_edit sends only
{ old, new } pairs instead of the whole page. sheet_delete moves a page and its sub-pages to the
Trash, only when your person asks; they restore it from there; db_trash_table does the same for a
table they name. comment_add speaks on a page, or on a row by its recordId.

Tables: db_list_tables shows each table's columns; db_query filters, sorts and groups rows;
db_mutate inserts (one row, or up to 500 in one call), updates or deletes them — a relation cell
may name its rows instead of holding their ids; db_row_activity says who changed a row and when.
db_define on a table that exists merges: send only the columns to add or change, nothing is
dropped. db_change_column renames or removes one column, or adds, renames or removes an option.

Working a backlog kept in Washi: find the issues table (db_list_tables), query the open rows,
take one, comment on its row what you are doing and, when done, the pull request — then move its
status with db_mutate. Leave rows you did not touch alone.`
