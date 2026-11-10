/** How much of a page's words `sheet_check` hands back as its preview. */
export const PREVIEW_CHARS = 4000

/** A file's type by its name, for an agent that names a file without one. */
export const MIME_BY_EXTENSION: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  svg: 'image/svg+xml',
  html: 'text/html',
  htm: 'text/html',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
  wav: 'audio/wav',
  flac: 'audio/flac',
  pdf: 'application/pdf',
  txt: 'text/plain',
  csv: 'text/csv',
  // Read as text; db_import tells them apart by name (D137).
  tsv: 'text/plain',
  jsonl: 'application/json',
  ndjson: 'application/json',
  md: 'text/markdown',
  json: 'application/json',
  zip: 'application/zip',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
}

/** Base64 for the largest upload a server takes (50 MB of video), with room to spare. */
export const MAX_BASE64_CHARS = 70_000_000

/** Where a drawn picture goes, said back with its key (D126). */
export const WEAR: Record<'figure' | 'cover' | 'icon', (key: string) => string> = {
  figure: (key) => `<Figure src="${key}" alt="…" caption="…" />`,
  cover: (key) => `<Sheet cover="${key}">`,
  icon: (key) => `<Sheet icon="${key}">`,
}

export const IMAGE_RENDER_DESCRIPTION = `Draw a picture from HTML and keep it as a PNG upload: a mockup, a diagram, a cover or an icon. Answers { key: 'file:<id>', width, height, wear } — put the key in a <Figure src> for a mockup, the Sheet's cover or icon for those. Never put HTML on a page to show a design: draw it here.
purpose: figure (1200×800, default), cover (1500×600, the band over a page: keep words off the bottom-left, where the icon sits), icon (256×256: one bold shape or glyph, centred, no small words). width/height override it.
The HTML is laid out without a browser: flexbox only (no grid, no floats, no position:fixed), inline style="…" or a <style> block of simple selectors, px/%/rem sizes, colours, gradients, borders, border-radius, box-shadow, opacity and inline <svg>. Fonts: sans-serif (Washi Sans) and serif (Washi Serif); emoji do not draw — use <svg> or words. No scripts, and nothing is fetched: a picture inside is a data:image/… address or file:<id> of an upload already in this workspace. A <div> with several children stacks them unless it says display:flex.
Inline <svg> is drawn whole as SVG, before the layout: paths and shapes, <g> and transforms, <defs> with clipPath, mask, linearGradient and radialGradient (referred to by url(#id)), <use href="#id">, filters, opacity, strokes and dashes, and <text>/<tspan> in the house fonts (font-family sans-serif or serif; any other family falls back to sans). Give each <svg> its size: width and height in px, or a viewBox (style width/height may then stretch it). Inside it, <image href> takes only a data:image/… address or file:<id>; scripts, <foreignObject> and handlers are dropped. Check what you drew with file_get on the key.`

/** `file_get`: a picture's longer side by default, and the range an agent may ask for (D138). */
export const FILE_GET_WIDTH = 1024
export const FILE_GET_MIN_WIDTH = 64
export const FILE_GET_MAX_WIDTH = 2048
/** How much of a text upload `file_get` answers. */
export const FILE_GET_TEXT_CHARS = 100_000
/** Pictures shown as stored when they cannot be drawn smaller, up to this many bytes. */
export const SHOWN_AS_IS = new Set(['image/webp'])
export const SHOWN_AS_IS_BYTES = 3_500_000
/** Uploads read as words, beside every text/* type. */
export const TEXT_TYPES = new Set(['application/json', 'application/xml', 'application/x-ndjson'])

export const FILE_GET_DESCRIPTION = `Look at an upload of this workspace: a picture comes back as an image you can see, a text file as its words. Use it to check what image_render drew before you put it on a page, or to read an uploaded .md, .csv or .json.
id: the upload's key, file:<id> (as file_upload, file_upload_url or image_render answered it, or as a page names it in a cover, an icon or a Figure's src). A PNG, JPEG or GIF is drawn smaller so its longer side is at most maxWidth (default 1024, 64–2048) and comes back as a PNG with { key, name, mime, bytes, size, shownAt } beside it; a WebP comes back as stored, up to 3.5 MB. Text (text/*, JSON, CSV, Markdown) comes back as words, cut at 100 000 characters (it says so). Anything else (a video, a PDF, AVIF) answers { key, name, mime, bytes, shown: false, why }.
Example: image_render { html: "…", purpose: "cover" } → { key: "file:abc" }, then file_get { id: "file:abc", maxWidth: 800 }.`

export const CONTEXT_GET_DESCRIPTION = `Read the workspace in one call, as Markdown: start here instead of sheet_list + a sheet_get per page + db_list_tables + a db_query per table. Answers, in order: the agent guide (the page this workspace keeps for agents, when it has one — read it first and follow it); the page tree (title, id, tags); every page's words as Markdown — headings, paragraphs, lists, written tables, callouts, step and timeline titles — with each block that draws a table's rows as one line ("Board over \`backlog\` where status ne Done grouped by status"); every table's columns and types, row count and counts per status and select value; and the open rows (status not in its done group) of the tables you name, or of every table with a status column, key columns only (db_query gives the ids). A table of 12 rows or fewer is listed whole.
Only what your member may read. maxChars (default 15000, 2000–200000) caps the whole answer: long pages are cut evenly, pages past what fits are counted in one line (read them with root), tables and rows past their share are named, and a "Left out" list at the end says what was cut and the call that reads it (sheet_get, db_query, sheet_list). Open rows come newest first, the total said even when fewer are shown. root (a page id) and depth (0 = that page alone) read part of the tree.
Example: context_get {} — or context_get { "root": "<page id>", "depth": 1, "tables": ["issues"], "maxChars": 8000 }.`

export const GUIDE_SET_DESCRIPTION = `Mark one page as this workspace's agent guide — the page outside agents read first, as CLAUDE.md is for a repo — or clear it with { "id": null }. Its words (cut at 6000 characters) are appended to this server's instructions on the next connection, lead context_get's answer, and workspace_list names it. Only when your person asks for it, and only an owner or an admin of the workspace may: the page must be one they read and in the page tree (not a row's page), and a current guide they cannot read is not theirs to move. Answers { guide: { id, title } | null }. Example: guide_set { "id": "<page id>" }.`

/** What an uploaded file may be for sheet_import to read it (D136). */
export const MARKDOWN_TYPES = new Set(['text/markdown', 'text/x-markdown', 'text/plain'])
export const MARKDOWN_FILE = /\.(md|markdown|mdown|txt)$/i

export const SHEET_IMPORT_DESCRIPTION = `Turn a Markdown document into a new page in one call: a README, a spec, meeting notes. Send markdown (the text, up to 500 000 characters) or file: 'file:<id>' of an uploaded .md or .txt — never both.
It converts: # headings → Title (levels 1–3; a leading # heading is the page's title unless you pass title), paragraphs → Text, - / 1. / - [ ] lists → List and Item (a checked box is done, nested lists stay nested), fenced code → Code with its language, pipe tables → a written Table (up to 16 columns, a new Table every 200 rows), > quotes → Quote, GitHub alerts (> [!NOTE], [!TIP], [!WARNING], [!CAUTION]) → Callout, --- → Divider, a picture alone on its line on https → Figure. **bold**, *em*, ~~strike~~, \`code\` and https or mailto links stay inline marks; a relative or http link keeps its address in brackets after its words. A block of HTML and a footnote are kept exactly as written in a Code block; HTML inside a line (<kbd>, <!-- comments -->) stays as visible words; each is listed in kept — nothing is dropped. { } < > are escaped for you.
The page is checked like sheet_check before it is saved, as yours. parentId (from sheet_list) files it under a page. dryRun: true saves nothing and answers { ok, diagnostics, source, preview, kept } — reshape that source and sheet_create it when the plain conversion is not the page you want.
Answers { id, title, parentId, version, url, kept }. Example: { markdown: "# Setup\\n\\nRun \`bun dev\`.\\n\\n- [x] Install\\n- [ ] Configure", parentId: "<a page id>" }.`

export const DB_IMPORT_DESCRIPTION = `Insert many rows into a table from a file, without passing them through your context row by row. Send exactly one of: file (an uploaded .csv, .tsv, .json or .jsonl — the file:<id> key file_upload answered), csv (CSV or TSV text, a header row first) or json (an array of row objects, or JSON / JSON Lines text).
Columns match the table's by name (exactly, ignoring case, or snake_cased: "Issue title" → issue_title); map renames the rest ({ "Summary": "title", "Internal": null } — null leaves one out). Columns that land nowhere, ids and formula/rollup columns are ignored and said in ignoredColumns, never fatal. Cells are read as people write them: numbers with thousands separators, "25%" as 0.25, yes/no/1/0/✓ for a checkbox, choices matched ignoring case, a multi_select or relation split on , or ; (a relation may name its rows). An empty cell stays empty.
A row that does not fit is refused with its row (and line, in a CSV) and why, and left out; the rest are written in batches of 500, each all or nothing — a batch the table refuses is reported with its rows and its words, and the next goes on. Up to 20 000 rows an import. Every row is signed by you and kept in its history, like db_mutate.
dryRun: true reads, matches and checks every row and writes nothing: run it first on a large file. Answers { inserted, ids (the first 500; idsTotal counts all), refused [{ row, line?, why }] (the first 100; refusedTotal), batches [{ from, to, inserted | error }], columns (source → table), ignoredColumns }.
Example: file_upload a backlog.csv, then db_import { table: "backlog", file: "file:<id>", map: { "Issue": "title" }, dryRun: true }, read refused, then again without dryRun.`

export const THEME_DEFINE_DESCRIPTION = `Make or change one of this workspace's page themes, ws:<slug> — what a <Sheet theme="ws:<slug>"> wears — with the same eight colours a mode the Settings theme editor sets. A new slug is made by you; an existing one changes in place (a rename keeps the slug, so every page keeps wearing it) — only if you made it, or you are an owner or admin.
Tokens, for light and for dark: bg (the page), card (cards, tables, callouts), ink (text), muted (quiet text: captions, hints), border (hairlines), mutedBg (quiet fills: chips, a table's head), accent (links, buttons, marks), accentInk (text on the accent). Colours as #RRGGBB, #RGB, rgb(), hsl() or oklch(); stored as #RRGGBB.
Every pairing is checked as the editor checks it: refused below its floor (ink on bg and on card 4.5:1, muted on card 3:1, accent on card 2.5:1, accentInk on accent 3:1, border not invisible on bg), and flagged below where it reads well (answered in warnings — fix those too). A name is the workspace's once, ignoring case.
Answers { key: 'ws:<slug>', name, created, light, dark, warnings, wear }. catalog_list lists the workspace's themes with their colours.
Example — mirin's brand: { slug: "mirin", name: "mirin", light: { bg: "#f7f4ec", card: "#fffdf8", ink: "#14100c", muted: "#6b5f52", border: "#e4dccd", mutedBg: "#efe8da", accent: "#8a4b12", accentInk: "#ffffff" }, dark: { bg: "#14100c", card: "#1d1813", ink: "#f7f4ec", muted: "#b3a796", border: "#3a3128", mutedBg: "#251f18", accent: "#dd9a3f", accentInk: "#14100c" } } — the amber #dd9a3f is the dark accent; on light paper its text is amber-700 #8a4b12, since #dd9a3f there reads at 2.4:1.`

export const WORKSPACE_LOOK_SET_DESCRIPTION = `Set the icon and cover every page without its own wears — a workspace's brand, so pages need not each repeat file ids. icon: a registry name, one emoji or file:<id> of an uploaded picture; cover: preset:<name>, picture:<name>, file:<id> or unsplash:<id> (catalog_list names them all). Leave one out to keep it, null to clear it; send neither to read what is set. A page's own icon or cover always wins, and no page is rewritten: the default is drawn, never saved into a page. Owners and admins only. Answers { icon, cover }.
Example: file_upload the logo, then workspace_look_set { icon: "file:<id>", cover: "preset:paper" }.`

export const SEARCH_DESCRIPTION = `Search the workspace's words: pages and table rows. Answers { pages: [{ id, title, icon, snippet }], rows: [{ table, recordId, title, column, snippet }] }, each up to 20. Pages match by full text (each word as a prefix), only those your member may read; a row matches when its text, url, select, status and multi_select cells hold every word, case-blind (up to 32 different words a search) (numbers, dates, people and relations are not searched — db_query filters them), newest first, never a deleted row or a table in the Trash. column names the cell the first word was found in. Open a page with sheet_get, a row with db_query { table, where: [{ column: "id", op: "eq", value: recordId }] }. Example: search { "term": "login timeout" }.`
