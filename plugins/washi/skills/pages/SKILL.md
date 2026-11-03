---
name: pages
description: Write or migrate pages and tables in a Washi workspace — turn markdown, HTML or notes into WSX pages, fill tables in bulk, give pages icons and covers. Use when asked to "put this doc in Washi", "make a page for …", "migrate these docs", "import these rows", or to restyle Washi pages.
argument-hint: "[what to write, or the files to bring in]"
---

# Write pages in Washi

Washi pages are WSX: JSX as data, a closed set of primitives. Every write lands as your person, with
its history, so write only what you were asked to.

## 1. Learn the vocabulary once

1. `wsx_reference` with no arguments: every primitive in one line, the look enums and the rules for
   text. Read its `writing` notes — they answer most questions:
   - Headings are `<Title level>`; paragraphs `<Text>`; lists `<List marker="bullet|number|check">`
     of `<Item>`; `<Section title>` groups blocks. There is no `H1`, `Heading`, `Markdown` or `Link`.
   - Words read inline marks: `**strong**`, `*em*`, `~~strike~~`, `` `code` ``,
     `[text](https://…)`. A nested list is a `List` inside an `Item`.
   - Text holding `{ } < >` is a string literal child: ``<Item>{"Route `/m/{slug}`"}</Item>``.
   - A markdown table is `<Table columns={['A', 'B']} rows={[['1', '**2**']]} />` (no `bind`).
   - Pages link with `<Ref sheet="<id>">words</Ref>`, `<PageLink sheet="<id>" />`, and a hub lists
     its sub-pages live with `<Subpages />` — make those with `sheet_create` and `parentId`.
2. `wsx_reference` with `primitives: [...]` for the few you will use: their props, types and an
   example that passes.
3. `catalog_list` for icons, covers (`preset:*`, `picture:*`) and themes. Never guess a name.

## 2. Write from files, not from your context

A page of more than a few KB goes in from a file. Write the WSX to a local file, check it, then send
it with the plugin's helper — the page never passes through your own tool call, and the answer is
only `{ id, title, version, url }`:

```bash
bun ${CLAUDE_PLUGIN_ROOT}/scripts/washi.mjs sheet_check source=@spec.wsx preview:=true
bun ${CLAUDE_PLUGIN_ROOT}/scripts/washi.mjs sheet_create title="Tech spec" source=@spec.wsx parentId=<docs page id>
bun ${CLAUDE_PLUGIN_ROOT}/scripts/washi.mjs sheet_replace id=<page id> title="Tech spec" source=@spec.wsx baseVersion=<version>
bun ${CLAUDE_PLUGIN_ROOT}/scripts/washi.mjs upload brand/og-card.png
bun ${CLAUDE_PLUGIN_ROOT}/scripts/washi.mjs db_mutate mutation:=@issues.json
```

`key=value` is text, `key:=…` is JSON, `@file` reads a file (`key=@base64:file` its bytes). Use
`node` if `bun` is not installed. The helper needs `WASHI_MCP_URL` and `WASHI_TOKEN` (an access token
from Settings → Account → Agents); signed in over OAuth with no token, send the source through the
MCP tools instead, a page at a time.

## 3. Change pages and tables in small steps

- A few lines of a page: `sheet_edit` with `edits: [{ old, new }]` and the `version` your last read
  or write returned as `baseVersion`. Each `old` must match once; all apply or none.
- A picture for an icon or cover: `upload` it (PNG, JPEG, WebP — never SVG), then set the
  `file:<id>` key it answers as the Sheet's `icon` or `cover`.
- Rows: one `db_mutate` insert takes up to 500 rows (`data: [{…}, …]`), all or nothing. A relation
  cell may name its rows — `epic: ['M4 · Every stat live']` — instead of holding their ids.
- Columns: `db_define` on a table that exists merges — send only the columns to add or change.
  `db_change_column` renames or removes a column, or adds, renames or removes one option.

## 4. Before you finish

Run `sheet_check` on every page you wrote (fix each diagnostic), and tell your person which pages and
tables you made or changed, with their links.
