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

/** Uploads a drawn picture may show inside it, inlined; never SVG (D95). */
export const INLINED_PICTURES: ReadonlySet<string> = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
])

/** Where a drawn picture goes, said back with its key (D126). */
export const WEAR: Record<'figure' | 'cover' | 'icon', (key: string) => string> = {
  figure: (key) => `<Figure src="${key}" alt="…" caption="…" />`,
  cover: (key) => `<Sheet cover="${key}">`,
  icon: (key) => `<Sheet icon="${key}">`,
}

export const IMAGE_RENDER_DESCRIPTION = `Draw a picture from HTML and keep it as a PNG upload: a mockup, a diagram, a cover or an icon. Answers { key: 'file:<id>', width, height, wear } — put the key in a <Figure src> for a mockup, the Sheet's cover or icon for those. Never put HTML on a page to show a design: draw it here.
purpose: figure (1200×800, default), cover (1500×600, the band over a page: keep words off the bottom-left, where the icon sits), icon (256×256: one bold shape or glyph, centred, no small words). width/height override it.
The HTML is laid out without a browser: flexbox only (no grid, no floats, no position:fixed), inline style="…" or a <style> block of simple selectors, px/%/rem sizes, colours, gradients, borders, border-radius, box-shadow, opacity and inline <svg>. Fonts: sans-serif (Washi Sans) and serif (Washi Serif); emoji do not draw — use <svg> or words. No scripts, and nothing is fetched: a picture inside is a data:image/… address or file:<id> of an upload already in this workspace. A <div> with several children stacks them unless it says display:flex.`
