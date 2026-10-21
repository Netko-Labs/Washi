// The docs on the LAN, plus the review loop: GET /_review lists notes, POST /_review appends one.
// `bun run docs` — port 8765, every interface. Notes land in tasks/design-review.jsonl.
import { appendFile } from 'node:fs/promises'
import { resolve, sep } from 'node:path'

const ROOT = resolve(import.meta.dir)
const NOTES = resolve(import.meta.dir, '../tasks/design-review.jsonl')
const PORT = Number(process.env.PORT ?? 8765)

async function notes(): Promise<string> {
  const file = Bun.file(NOTES)
  if (!(await file.exists())) return '[]'
  const lines = (await file.text()).split('\n').filter(Boolean)
  return `[${lines.join(',')}]`
}

function json(body: string, status = 200): Response {
  return new Response(body, { status, headers: { 'content-type': 'application/json' } })
}

/** Decode, resolve, then refuse anything that does not sit under docs/ — `..` and `%2f` alike. */
function fileFor(pathname: string): string | null {
  let path: string
  try {
    path = decodeURIComponent(pathname)
  } catch {
    return null
  }
  if (path.endsWith('/')) path += 'index.html'
  const target = resolve(ROOT, `.${path}`)
  return target === ROOT || target.startsWith(ROOT + sep) ? target : null
}

Bun.serve({
  port: PORT,
  hostname: '0.0.0.0',
  async fetch(request) {
    const url = new URL(request.url)
    if (url.pathname === '/_review') {
      if (request.method === 'GET') return json(await notes())
      if (request.method === 'POST') {
        const note = await request.json()
        const row = { ...note, at: new Date().toISOString() }
        await Bun.write(
          NOTES,
          `${(await Bun.file(NOTES).exists()) ? await Bun.file(NOTES).text() : ''}${JSON.stringify(row)}\n`,
        )
        return json(JSON.stringify(row), 201)
      }
      return new Response('method', { status: 405 })
    }
    const target = fileFor(url.pathname)
    if (!target) return new Response('not found', { status: 404 })
    const file = Bun.file(target)
    if (!(await file.exists())) return new Response('not found', { status: 404 })
    return new Response(file, { headers: { 'cache-control': 'no-cache' } })
  },
})
console.log(`docs on http://localhost:${PORT}/ — review notes → tasks/design-review.jsonl`)
