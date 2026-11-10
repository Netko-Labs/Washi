import { Resvg } from '@resvg/resvg-wasm'
import { engine } from './engine'
import { pictureSize } from './size'
import type { ScaledPicture } from './types'
import { PNG, SCALABLE_TYPES } from './values'

/**
 * A picture made small enough to look at (D138): its longer side at most `maxSide`. One that
 * already fits comes back as it is; a larger PNG, JPEG or GIF is drawn smaller by resvg, as a PNG.
 * Null for a picture resvg cannot read (WebP, AVIF) or whose header says no size.
 */
export async function scaledPicture(
  bytes: Uint8Array,
  mime: string,
  maxSide: number,
): Promise<ScaledPicture | null> {
  if (!SCALABLE_TYPES.has(mime)) return null
  const size = pictureSize(bytes, mime)
  if (!size || size.width < 1 || size.height < 1) return null
  const longer = Math.max(size.width, size.height)
  if (longer <= maxSide) return { bytes, mime, ...size, original: size }
  await engine()
  const scale = maxSide / longer
  const width = Math.max(1, Math.round(size.width * scale))
  const height = Math.max(1, Math.round(size.height * scale))
  const data = Buffer.from(bytes).toString('base64')
  const drawn = new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}"><image width="${size.width}" height="${size.height}" href="data:${mime};base64,${data}"/></svg>`,
    { fitTo: { mode: 'width', value: width } },
  )
    .render()
    .asPng()
  return { bytes: drawn, mime: PNG, width, height, original: size }
}
