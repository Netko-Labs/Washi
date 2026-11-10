import type { McpChange } from './types'

export const SERVER_INFO = { name: 'washi', version: '0.1.0' }

/** Which writes move what an open page shows, by a capability's prefix; any other write, a page. */
export const CHANGES: Record<string, McpChange[]> = {
  sheet: ['page'],
  db: ['data', 'page'],
  comment: ['page'],
  reminder: ['data'],
  // An upload changes nothing on screen until a page wears it; a drawn picture is one (D126).
  file: [],
  image: [],
  // context_get reads; guide_set moves a pointer no page draws.
  context: [],
  guide: [],
}
export const DEFAULT_CHANGE: McpChange[] = ['page']

export const INSTRUCTIONS = `Washi is a team's knowledge base: pages written in WSX (JSX as data, a closed set of
primitives) and tables that work like Notion databases. You act as one member of one workspace:
you read what they can read, and every write lands as theirs, with its history.

Start with context_get: the whole workspace in one call, as Markdown — the agent guide first when
the workspace keeps one, the page tree, every page's words, every table's columns and counts, and
the open rows — cut to maxChars, ending with what it left out and the call that reads it. guide_set
marks the page agents read first, only when your person (an owner or an admin) asks. Large files never go through you:
file_upload_url answers a URL to curl -T the file to, file_upload_from has the server fetch an
https URL; file_upload (base64) is for a few KB.

Writing pages: call wsx_reference first — every primitive with its props, and the rules for text
(inline **strong** *em* \`code\` [links](https://…), escaping { } < > as {"…"}, a markdown table as
<Table columns rows />, page links with <Ref>, <PageLink> and a live <Subpages />). Ask it for a few
primitives by name to get their props and an example. catalog_list names every icon, cover and
theme a <Sheet> may wear; file_upload turns a picture into a file:<id> key for an icon or a cover.
image_render draws HTML into a PNG upload — a mockup for a <Figure src alt>, a cover or an icon —
so a design is a picture on the page, never HTML or a widget.
A Markdown document (a README, a spec) is one sheet_import call: it converts and checks it for you.
Run sheet_check (preview: true shows the words it draws) before sheet_create or sheet_replace.
Writes answer { id, title, version } — pass that version back as baseVersion on your next write so a
teammate's typing is merged, not overwritten. To change a few lines, sheet_edit sends only
{ old, new } pairs instead of the whole page. sheet_delete moves a page and its sub-pages to the
Trash, only when your person asks; they restore it from there; db_trash_table does the same for a
table they name. comment_add speaks on a page, or on a row by its recordId.

Tables: db_list_tables shows each table's columns; db_query filters, sorts and groups rows;
db_mutate inserts (one row, or up to 500 in one call), updates or deletes them — a relation cell
may name its rows instead of holding their ids; db_import loads a CSV, TSV or JSON file (an upload,
or sent inline) in batches of 500 — dryRun first; db_row_activity says who changed a row and when.
db_define on a table that exists merges: send only the columns to add or change, nothing is
dropped. db_change_column renames or removes one column, or adds, renames or removes an option.

Working a backlog kept in Washi: find the issues table (db_list_tables), query the open rows,
take one, comment on its row what you are doing and, when done, the pull request — then move its
status with db_mutate. Leave rows you did not touch alone.`

/** The argument every tool takes when a sign-in reaches more than one workspace (D124). */
export const WORKSPACE_ARG =
  'The workspace to act in: its id or its name, from workspace_list. Leave it out for the default one.'

/** Added to the instructions when a sign-in reaches several workspaces. */
export const MANY_WORKSPACES = `

You may work in several workspaces: workspace_list names them, the default first. Every tool takes
an optional workspace (an id or a name); leave it out for the default. Ids from one workspace —
pages, rows, versions — mean nothing in another, so name the same workspace on every call about
them. Never copy a page or rows from one workspace into another unless your person asks.`
