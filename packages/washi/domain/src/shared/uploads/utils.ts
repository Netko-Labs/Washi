import type { CodeLimits } from '../../entities/safeguards'
import type { ByteRange, UploadCaps, UploadKind } from './types'
import { MB, UPLOAD_CAPS, UPLOAD_RULES } from './values'

/** Which kind a type is, or null for one no workspace takes. */
export function uploadKindOf(mime: string): UploadKind | null {
  const bare = mime.split(';')[0]?.trim().toLowerCase() ?? ''
  for (const [kind, rule] of Object.entries(UPLOAD_RULES) as [
    UploadKind,
    (typeof UPLOAD_RULES)[UploadKind],
  ][]) {
    if (rule.mimes.includes(bare)) return kind
  }
  return null
}

/** The caps a server's limits set (D118). */
export const uploadCaps = (limits: CodeLimits): UploadCaps => ({
  image: limits.imageMb * MB,
  video: limits.videoMb * MB,
  audio: limits.audioMb * MB,
  file: limits.fileMb * MB,
})

/** The largest upload of any kind: the body cap, read before the form is. */
export const largestUpload = (caps: UploadCaps): number => Math.max(...Object.values(caps))

/**
 * Why an upload is refused, in words; null when it may land. `only` narrows to one kind; `caps` are
 * the server's, today's when it set none.
 */
export function uploadRefusal(
  mime: string,
  size: number,
  only?: UploadKind,
  caps: UploadCaps = UPLOAD_CAPS,
): string | null {
  const kind = uploadKindOf(mime)
  if (!kind || (only && kind !== only)) {
    return only ? `${UPLOAD_RULES[only].noun} only` : 'that kind of file is not taken'
  }
  if (size === 0) return 'that file is empty'
  const cap = caps[kind]
  return size > cap ? `${UPLOAD_RULES[kind].noun} up to ${Math.round(cap / MB)} MB` : null
}

/**
 * The name an upload keeps: its last path segment, no control characters. Browsers send `"`, CR
 * and LF in a multipart filename as `%22 %0D %0A`; Bun hands them on undecoded, and an empty part
 * no name at all.
 */
export function uploadName(sent: string | undefined): string {
  const decoded = (sent ?? '')
    .replace(/%22/gi, '"')
    .replace(/%0[ad]/gi, '')
    .replace(/\\"/g, '"')
  const last = decoded.split(/[/\\]/).pop() ?? ''
  const name = [...last]
    .filter((char) => char.charCodeAt(0) >= 0x20 && char.charCodeAt(0) !== 0x7f)
    .join('')
    .trim()
  return name === '' || name === '.' || name === '..' ? 'file' : name
}

/** `Content-Disposition` for a stored name: RFC 5987 for the real one, plain ASCII beside it. */
export function contentDisposition(name: string, isInline: boolean): string {
  const fallback = name.replace(/[^\x20-\x7e]|["\\]/g, '_')
  const encoded = encodeURIComponent(name).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  )
  return `${isInline ? 'inline' : 'attachment'}; filename="${fallback}"; filename*=UTF-8''${encoded}`
}

/** What a browser shows inline; anything else downloads, so nothing from an upload renders as a page. */
export const isInlineType = (mime: string): boolean => {
  const kind = uploadKindOf(mime)
  return kind === 'image' || kind === 'video' || kind === 'audio' || mime === 'application/pdf'
}

/** The `accept` a file picker offers for a kind. */
export const acceptFor = (kind: UploadKind): string => UPLOAD_RULES[kind].mimes.join(',')

/**
 * `bytes=a-b` against a length: the slice a player asked for, `unsatisfiable` for one wholly past
 * the end (a 416), or null to send the whole file.
 */
export function byteRange(header: string | null, length: number): ByteRange | null {
  const match = header?.match(/^bytes=(\d*)-(\d*)$/)
  if (!match || (!match[1] && !match[2])) return null
  if (match[1] && match[2] && Number(match[1]) > Number(match[2])) return null
  const start = match[1] ? Number(match[1]) : Math.max(0, length - Number(match[2]))
  const end = match[1] && match[2] ? Math.min(Number(match[2]), length - 1) : length - 1
  return start <= end ? { start, end } : 'unsatisfiable'
}
