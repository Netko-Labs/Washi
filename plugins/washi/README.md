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

Run `/mcp` in Claude Code: Washi opens in the browser, you sign in, pick the workspace it may work
in, and allow it. For an agent with no browser (CI, a server), make a token instead in **Settings →
Account → Agents** and set both — the address then names the workspace:

```bash
export WASHI_MCP_URL="https://washi.example.com/mcp/<workspace-id>"
export WASHI_TOKEN="washi_pat_…"
```

`/mcp` shows the `washi` server connected. Ask for the next issue, or run `/washi:backlog`.

## What it can do

Read and search pages, read and write rows (`db_query`, `db_mutate` — up to 500 rows a call), write
and edit pages (`sheet_create`, `sheet_replace`, `sheet_edit`), upload pictures (`file_upload`) and
comment on a page or a row — as you, through the same checks and history as the app. `wsx_reference`
and `catalog_list` say what a page may be written with and wear. It cannot fetch the web or run
anything outside the workspace.

## Writing from local files

A large page or a picture should not pass through the agent's own tool call. With a token set,
`scripts/washi.mjs` reads it from disk and calls the same MCP tool:

```bash
bun scripts/washi.mjs sheet_create title=Spec source=@spec.wsx
bun scripts/washi.mjs upload brand/og-card.png
bun scripts/washi.mjs db_mutate mutation:=@rows.json
```

`key=value` is text, `key:=…` JSON, `@file` a file's text (`@base64:file` its bytes). It runs under
`bun` or `node`, with no packages.
