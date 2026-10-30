import type { WsxElement, WsxValue } from '@washi/wsx'
import type { CSSProperties } from 'react'
import { COVER_PRESETS } from '../registry/looks'
import type { SheetLook, SheetLookHost } from './types'

/** The page's own paper and look — theme, feel, accent, icon, cover — read off its `<Sheet>`. */
export function frameOf(root: WsxElement): SheetLook {
  const pick = (value: WsxValue | undefined) => (typeof value === 'string' ? value : undefined)
  return {
    theme: pick(root.props.theme),
    feel: pick(root.props.feel),
    accent: pick(root.props.accent),
    icon: pick(root.props.icon),
    cover: pick(root.props.cover),
  } as SheetLook
}

/** A cover key as a background: a preset's gradient, or the picture the host lends. */
export function coverStyle(cover: string, look: SheetLookHost): CSSProperties {
  const [kind, key] = [cover.slice(0, cover.indexOf(':')), cover.slice(cover.indexOf(':') + 1)]
  if (kind === 'preset') return { background: COVER_PRESETS[key]?.background }
  const url =
    kind === 'picture'
      ? look.pictureUrl?.(key)
      : kind === 'unsplash'
        ? look.unsplash?.(key)?.url
        : look.fileUrl?.(key)
  return url ? { backgroundImage: `url(${url})` } : {}
}

/** A media src as an address: an upload through the host, an https address as itself. */
export function mediaUrl(src: string, look: SheetLookHost): string | null {
  return src.startsWith('file:') ? (look.fileUrl?.(src.slice('file:'.length)) ?? null) : src
}
