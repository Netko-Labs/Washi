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
The HTML is laid out without a browser: flexbox only (no grid, no floats, no position:fixed), inline style="…" or a <style> block of simple selectors, px/%/rem sizes, colours, gradients, borders, border-radius, box-shadow, opacity and inline <svg>. Fonts: sans-serif (Washi Sans) and serif (Washi Serif); emoji do not draw — use <svg> or words. No scripts, and nothing is fetched: a picture inside is a data:image/… address or file:<id> of an upload already in this workspace. A <div> with several children stacks them unless it says display:flex.`

export const CONTEXT_GET_DESCRIPTION = `Read the workspace in one call, as Markdown: start here instead of sheet_list + a sheet_get per page + db_list_tables + a db_query per table. Answers, in order: the agent guide (the page this workspace keeps for agents, when it has one — read it first and follow it); the page tree (title, id, tags); every page's words as Markdown — headings, paragraphs, lists, written tables, callouts, step and timeline titles — with each block that draws a table's rows as one line ("Board over \`backlog\` where status ne Done grouped by status"); every table's columns and types, row count and counts per status and select value; and the open rows (status not in its done group) of the tables you name, or of every table with a status column, key columns only (db_query gives the ids). A table of 12 rows or fewer is listed whole.
Only what your member may read. maxChars (default 15000, 2000–200000) caps the whole answer: long pages are cut evenly, pages past what fits are counted in one line (read them with root), tables and rows past their share are named, and a "Left out" list at the end says what was cut and the call that reads it (sheet_get, db_query, sheet_list). Open rows come newest first, the total said even when fewer are shown. root (a page id) and depth (0 = that page alone) read part of the tree.
Example: context_get {} — or context_get { "root": "<page id>", "depth": 1, "tables": ["issues"], "maxChars": 8000 }.`

export const GUIDE_SET_DESCRIPTION = `Mark one page as this workspace's agent guide — the page outside agents read first, as CLAUDE.md is for a repo — or clear it with { "id": null }. Its words (cut at 6000 characters) are appended to this server's instructions on the next connection, lead context_get's answer, and workspace_list names it. Only when your person asks for it, and only an owner or an admin of the workspace may: the page must be one they read and in the page tree (not a row's page), and a current guide they cannot read is not theirs to move. Answers { guide: { id, title } | null }. Example: guide_set { "id": "<page id>" }.`
