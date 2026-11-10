/** How long an upload URL lives. */
export const TICKET_TTL_MS = 10 * 60 * 1000
/** Tickets waiting at once, across the server; the oldest go first past it. */
export const MAX_TICKETS = 1_000
/** Where tickets live: one map per process, whichever copy of the bundle asks (CLAUDE.md). */
export const TICKETS_KEY = 'washi.mcp.upload-tickets'

export const FILE_UPLOAD_URL_DESCRIPTION = `Get a URL to upload one file to without its bytes passing through you: answers { url, method: 'PUT', key: 'file:<id>', expiresAt, curl }. Run the curl line (curl -T <path> <url>) in a shell — the body is the raw file, no form, no auth header; the URL is the permission. It works once, for 10 minutes, and only for exactly \`bytes\` bytes of that file; the key is the file's from the moment the PUT answers 201 (wear it in a <Figure src>, a Sheet's icon or cover, a <File src>). Same types and sizes as file_upload: pictures (png, jpeg, webp, gif, avif) up to 10 MB, videos 50 MB, audio and documents (pdf, txt, csv, md, json, zip, docx, xlsx, pptx) 25 MB unless the server says otherwise; never HTML or SVG. Use file_upload (base64) only for a file of a few KB.
Example: file_upload_url { "filename": "shot.png", "bytes": 5242880 } then curl --fail-with-body -T shot.png '<url>'.`

export const FILE_UPLOAD_FROM_DESCRIPTION = `Have the server fetch a file from an https URL and keep it as an upload — nothing passes through you. Answers { key: 'file:<id>', name, mime, size, source }. The URL's own host only (a redirect to another host is refused), https only, no private or local addresses; the type is the one the host says, else read off filename or the URL's path, and the same types and sizes as file_upload apply. Each fetch is kept in the workspace's ledger. Use it for a picture or a document already online — a release asset, a public screenshot; for a file on your disk, file_upload_url.
Example: file_upload_from { "url": "https://github.com/acme/app/releases/download/v1/shot.png" }.`
