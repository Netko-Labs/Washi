# Washi for Claude Code

Work a [Washi](https://github.com/Netko-Labs/Washi) workspace from Claude Code: its pages and tables
as MCP tools, acting as you, and a `backlog` skill that takes an issue kept in Washi to a pull request
and back.

## Install

```bash
claude plugin marketplace add Netko-Labs/Washi
claude plugin install washi@netko-labs
```

Then tell it where your workspace is. In Washi, open **Settings → Account → Agents**: copy the MCP
address, make a token, and set both where Claude Code runs:

```bash
export WASHI_MCP_URL="https://washi.example.com/mcp/<workspace-id>"
export WASHI_TOKEN="washi_pat_…"
```

`/mcp` shows the `washi` server connected. Ask for the next issue, or run `/washi:backlog`.

## What it can do

Read and search pages, read and write rows (`db_query`, `db_mutate`, …), write pages, and comment on
a page or a row — as you, through the same checks and history as the app. It cannot fetch the web or
run anything outside the workspace.
