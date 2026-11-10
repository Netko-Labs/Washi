# Washi for Claude Code

Work a [Washi](https://github.com/Netko-Labs/Washi) workspace from Claude Code: its pages and tables
as MCP tools, acting as you; a `backlog` skill that takes an issue kept in Washi to a pull request
and back; and a `pages` skill for writing and migrating pages and tables.

## Install

```bash
claude plugin marketplace add Netko-Labs/Washi
claude plugin install washi@netko-labs
```

Then point it at your Washi server and sign in:

```bash
export WASHI_MCP_URL="https://washi.example.com/mcp"
```

Run `/mcp` in Claude Code: Washi opens in the browser, you sign in, tick the workspaces it may work
in, and allow it. With more than one, `workspace_list` names them and every tool takes a
`workspace` (an id or a name); the first one ticked is the default. To add one later, sign in again
from `/mcp` — the consent screen starts from what it already has. For an agent with no browser (CI, a server), make a token instead in **Settings →
Account → Agents** and set both — the address then names the workspace:

```bash
export WASHI_MCP_URL="https://washi.example.com/mcp/<workspace-id>"
export WASHI_TOKEN="washi_pat_…"
```

`/mcp` shows the `washi` server connected. Ask for the next issue, or run `/washi:backlog`.

## What it can do

Read a whole workspace in one call (`context_get`: its agent guide, the page tree, every page as
Markdown, each table's counts and open rows, cut to a budget), read and search pages, read and write
rows (`db_query`, `db_mutate` — up to 500 rows a call; `db_import` loads a CSV, TSV or JSON file in
batches of 500, up to 20 000 rows), write and edit pages (`sheet_create`, `sheet_replace`,
`sheet_edit`), turn a Markdown file into a page (`sheet_import`), upload pictures (`file_upload`) and
comment on a page or a row — as you, through the same checks and history as the app. `wsx_reference`
and `catalog_list` say what a page may be written with and wear. A workspace may mark one page as
its **agent guide** (an owner or admin, from the page's ⋯ → Agent guide or `guide_set`): its words join the server's
instructions when an agent connects, as `CLAUDE.md` does for a repo. Large files skip the agent's
context: `file_upload_url` answers a one-time URL to `curl -T` the file to, and `file_upload_from`
has the server fetch an https file. `file_get` shows the agent an upload — a picture as an image it
can see (so it checks what `image_render` drew), a text file as its words. Past those uploads, it cannot fetch the web or run anything
outside the workspace.

## Writing from local files

A large page or a picture should not pass through the agent's own tool call. With a token set,
`scripts/washi.mjs` reads it from disk and calls the same MCP tool:

```bash
bun scripts/washi.mjs sheet_create title=Spec source=@spec.wsx
bun scripts/washi.mjs sheet_import markdown=@README.md parentId=<docs page id>
bun scripts/washi.mjs upload brand/og-card.png --workspace DashiOS
bun scripts/washi.mjs db_mutate mutation:=@rows.json
bun scripts/washi.mjs upload issues.csv            # answers file:<id>
bun scripts/washi.mjs db_import table=issues file=file:<id> dryRun:=true
```

`key=value` is text, `key:=…` JSON, `@file` a file's text (`@base64:file` its bytes), and
`--workspace <name>` acts in another workspace. `upload` asks `file_upload_url` for a one-time URL
and PUTs the file there, so its bytes never pass through a tool call. It runs under `bun` or `node`,
with no packages.
