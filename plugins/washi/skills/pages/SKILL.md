---
name: pages
description: Write or migrate pages and tables in a Washi workspace — turn markdown, HTML or notes into WSX pages, fill tables in bulk, give pages icons and covers. Use when asked to "put this doc in Washi", "make a page for …", "migrate these docs", "import these rows", or to restyle Washi pages.
argument-hint: "[what to write, or the files to bring in]"
---

# Write pages in Washi

Washi pages are WSX: JSX as data, a closed set of primitives. Every write lands as your person, with
its history, so write only what you were asked to.

## 0. Read the workspace in one call

`context_get` answers the whole workspace as Markdown: its agent guide first (follow it), the page
tree, every page's words, every table's columns and counts, and the open rows — cut to `maxChars`
(15 000 by default), ending with what it left out and the call that reads each part. Start there,
not with a `sheet_get` per page.

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

## 2. Markdown comes in whole

A README, a spec or notes already in Markdown is one call — never rewrite it into WSX by hand:

```bash
bun ${CLAUDE_PLUGIN_ROOT}/scripts/washi.mjs sheet_import markdown=@README.md parentId=<docs page id>
```

`sheet_import` converts headings, paragraphs, lists (checked boxes too), fenced code, pipe tables,
quotes and GitHub alerts, keeps inline marks and links, escapes `{ } < >`, checks the page and saves
it as your person. Raw HTML and footnotes stay as written in a Code block, listed in `kept` — look at
those and rewrite them if they matter. Over OAuth with no token, send `markdown` through the tool
itself, or `file_upload` the `.md` and pass `file: 'file:<id>'`. To reshape the page first, pass
`dryRun: true`: it answers the WSX, which you edit and `sheet_create`.

## 3. Write from files, not from your context

A page of more than a few KB goes in from a file. Write the WSX to a local file, check it, then send
it with the plugin's helper — the page never passes through your own tool call, and the answer is
only `{ id, title, version, url }`:

```bash
bun ${CLAUDE_PLUGIN_ROOT}/scripts/washi.mjs sheet_check source=@spec.wsx preview:=true
bun ${CLAUDE_PLUGIN_ROOT}/scripts/washi.mjs sheet_create title="Tech spec" source=@spec.wsx parentId=<docs page id>
bun ${CLAUDE_PLUGIN_ROOT}/scripts/washi.mjs sheet_replace id=<page id> title="Tech spec" source=@spec.wsx baseVersion=<version>
bun ${CLAUDE_PLUGIN_ROOT}/scripts/washi.mjs upload brand/og-card.png --workspace DashiOS
bun ${CLAUDE_PLUGIN_ROOT}/scripts/washi.mjs db_mutate mutation:=@issues.json
```

`key=value` is text, `key:=…` is JSON, `@file` reads a file (`key=@base64:file` its bytes);
`--workspace <name>` acts in another workspace. `upload` sends the bytes to a one-time URL
(`file_upload_url`), so a 5 MB screenshot never passes through a tool call. Use
`node` if `bun` is not installed. The helper needs `WASHI_MCP_URL` and `WASHI_TOKEN` (an access token
from Settings → Account → Agents); signed in over OAuth with no token, send the source through the
MCP tools instead, a page at a time.

## 4. Change pages and tables in small steps

- A few lines of a page: `sheet_edit` with `edits: [{ old, new }]` and the `version` your last read
  or write returned as `baseVersion`. Each `old` must match once; all apply or none.
- A picture for an icon or cover: `upload` it (PNG, JPEG, WebP — never SVG), then set the
  `file:<id>` key it answers as the Sheet's `icon` or `cover`. Without the helper, never base64 a
  large file into `file_upload`: `file_upload_url { filename, bytes }` answers a one-time URL and a
  `curl -T` line to run (the key is the file's once the PUT answers 201), and `file_upload_from
  { url }` has the server fetch an https file itself.
- Rows: one `db_mutate` insert takes up to 500 rows (`data: [{…}, …]`), all or nothing. A relation
  cell may name its rows — `epic: ['M4 · Every stat live']` — instead of holding their ids.
- Columns: `db_define` on a table that exists merges — send only the columns to add or change.
  `db_change_column` renames or removes a column, or adds, renames or removes one option.

## 5. Before you finish

Run `sheet_check` on every page you wrote (fix each diagnostic), and tell your person which pages and
tables you made or changed, with their links.
