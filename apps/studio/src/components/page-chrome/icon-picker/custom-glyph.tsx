import { hostFileUrl } from '@washi/ui'
import type { CustomGlyphProps } from './lib'

export function CustomGlyph({ fileId, name }: CustomGlyphProps) {
  const url = hostFileUrl()?.(fileId)
  if (!url) return <span className="text-[11px]">:{name.slice(0, 2)}:</span>
  return <img src={url} alt="" loading="lazy" className="size-[22px] object-contain" />
}
