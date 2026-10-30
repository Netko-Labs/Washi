import type { CodeLimits } from '../../entities/safeguards'
import type { UploadCaps, UploadKind } from './types'
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
  const cap = caps[kind]
  return size > cap ? `${UPLOAD_RULES[kind].noun} up to ${Math.round(cap / MB)} MB` : null
}

/** What a browser shows inline; anything else downloads, so nothing from an upload renders as a page. */
export const isInlineType = (mime: string): boolean => {
  const kind = uploadKindOf(mime)
  return kind === 'image' || kind === 'video' || kind === 'audio' || mime === 'application/pdf'
}

/** The `accept` a file picker offers for a kind. */
export const acceptFor = (kind: UploadKind): string => UPLOAD_RULES[kind].mimes.join(',')

/** `bytes=a-b` against a length: the slice a player asked for, or null to send the whole file. */
export function byteRange(
  header: string | null,
  length: number,
): { start: number; end: number } | null {
  const match = header?.match(/^bytes=(\d*)-(\d*)$/)
  if (!match || (!match[1] && !match[2])) return null
  const start = match[1] ? Number(match[1]) : Math.max(0, length - Number(match[2]))
  const end = match[1] && match[2] ? Math.min(Number(match[2]), length - 1) : length - 1
  return start <= end && start < length ? { start, end } : null
}
