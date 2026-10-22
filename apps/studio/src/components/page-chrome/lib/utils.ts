import type { CoverLook, ParsedCover } from './types'
import { COVERS, PICTURES } from './values'

/** `preset:sage` · `picture:fjord` · `file:<id>`; a bare key from before D60 is a preset. */
export function parseCover(cover: string | null): ParsedCover | null {
  if (!cover) return null
  const at = cover.indexOf(':')
  if (at < 0) return COVERS[cover] ? { kind: 'preset', key: cover } : null
  const kind = cover.slice(0, at)
  const key = cover.slice(at + 1)
  if (!key) return null
  if (kind === 'preset') return COVERS[key] ? { kind, key } : null
  if (kind === 'picture') return PICTURES.some((p) => p.slug === key) ? { kind, key } : null
  if (kind === 'file') return { kind, key }
  return null
}

export function pictureUrl(slug: string): string {
  return `/covers/${slug}.jpg`
}

export function fileUrl(id: string, workspaceId: string): string {
  return `/api/files/${id}?workspace=${encodeURIComponent(workspaceId)}`
}

export function coverLook(cover: ParsedCover, workspaceId: string): CoverLook {
  if (cover.kind === 'preset') {
    return { style: { background: COVERS[cover.key]?.background }, caption: null }
  }
  const url = cover.kind === 'picture' ? pictureUrl(cover.key) : fileUrl(cover.key, workspaceId)
  return {
    style: {
      backgroundImage: `url(${url})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
    caption:
      cover.kind === 'picture' ? (PICTURES.find((p) => p.slug === cover.key)?.label ?? null) : null,
  }
}

export function sameCover(current: string | null, kind: ParsedCover['kind'], key: string): boolean {
  const parsed = parseCover(current)
  return parsed?.kind === kind && parsed.key === key
}
