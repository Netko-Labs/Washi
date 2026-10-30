import { CODE_LIMITS } from '@washi/domain'
import { FILE_KEY } from '@washi/paper/registry'
import { api, hostFileUrl } from '../api'
import { CAP_FRESH_MS, KEPT_UPLOADS, MB } from './constants'

let cap: { at: number; bytes: Promise<number> } | null = null
const kept = new Map<string, Promise<Uint8Array>>()

/** What one upload a page reads may weigh here (D118); a failed read falls back to today's. */
function readCap(): Promise<number> {
  if (!cap || Date.now() - cap.at > CAP_FRESH_MS) {
    const asked = { at: Date.now(), bytes: api.files.readCap.query() }
    cap = asked
    asked.bytes.catch(() => {
      if (cap === asked) cap = null
    })
  }
  return cap.bytes.catch(() => CODE_LIMITS.fileReadMb * MB)
}

const tooBig = (key: string, bytes: number, max: number) =>
  new Error(
    `${key} is ${Math.ceil(bytes / MB)} MB — a page reads at most ${Math.floor(max / MB)} MB here`,
  )

async function fetchUpload(key: string): Promise<Uint8Array> {
  const url = hostFileUrl()?.(key.slice('file:'.length))
  if (!url) throw new Error('this app stores no files')
  const max = await readCap()
  const response = await fetch(url, { credentials: 'same-origin' })
  if (response.status === 404) throw new Error(`${key} is not an upload you can open`)
  if (!response.ok) throw new Error(`${key} did not load (${response.status})`)
  const declared = Number(response.headers.get('content-length'))
  if (declared > max) throw tooBig(key, declared, max)
  const bytes = new Uint8Array(await response.arrayBuffer())
  if (bytes.byteLength > max) throw tooBig(key, bytes.byteLength, max)
  return bytes
}

/**
 * An upload's bytes through the same route and gate as any picture on the page (D119): read
 * once per key — what an id holds never changes — the last few kept.
 */
export function readUpload(key: string): Promise<Uint8Array> {
  if (!FILE_KEY.test(key)) {
    return Promise.reject(new Error(`${key} is not an upload — a file is file:<id>`))
  }
  const known = kept.get(key)
  if (known) return known
  const asked = fetchUpload(key)
  kept.set(key, asked)
  asked.catch(() => kept.delete(key))
  while (kept.size > KEPT_UPLOADS) kept.delete(kept.keys().next().value ?? '')
  return asked
}
