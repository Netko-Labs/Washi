import { uploadCaps, uploadName, uploadRefusal } from '@washi/domain'
import type { FileStore, Workspace } from '@washi/repository'
import { z } from 'zod'
import {
  IMAGE_PRESETS,
  type ImagePurpose,
  INLINED_TYPES,
  MAX_HTML_CHARS,
  MAX_SIDE,
  MIN_SIDE,
  renderHtml,
} from '../images'
import { codeLimits } from '../server'
import { capability } from './define'
import type { Capability } from './types'
import { IMAGE_RENDER_DESCRIPTION, WEAR } from './values'

const side = z.number().int().min(MIN_SIDE).max(MAX_SIDE)

/**
 * Pictures drawn from HTML (D126): a mockup for a Figure, a cover, an icon. The markup is laid out
 * on the server and stored as a PNG upload, so a page shows a picture — never runs the markup.
 */
export function imageCapabilities(
  ws: Workspace,
  files: FileStore,
  fileUrl?: (id: string) => string,
): Capability[] {
  const inlineFile = async (id: string) => {
    const found = await files.get(id)
    if (!found || !INLINED_TYPES.has(found.file.mime)) return null
    return `data:${found.file.mime};base64,${Buffer.from(found.bytes).toString('base64')}`
  }
  return [
    capability(
      'image_render',
      IMAGE_RENDER_DESCRIPTION,
      {
        html: z.string().min(1).max(MAX_HTML_CHARS),
        purpose: z.enum(['figure', 'cover', 'icon']).optional(),
        width: side.optional(),
        height: side.optional(),
        filename: z.string().min(1).max(120).optional(),
      },
      false,
      async ({ html, purpose, width, height, filename }) => {
        const kind: ImagePurpose = purpose ?? 'figure'
        const size = {
          width: width ?? IMAGE_PRESETS[kind].width,
          height: height ?? IMAGE_PRESETS[kind].height,
        }
        const bytes = await renderHtml({ html, ...size }, inlineFile)
        const refusal = uploadRefusal(
          'image/png',
          bytes.byteLength,
          undefined,
          uploadCaps(codeLimits(ws)),
        )
        if (refusal)
          throw new Error(`the picture came out too large (${refusal}) — draw it smaller`)
        const name = uploadName(filename?.replace(/\.[a-z0-9]+$/i, '') || kind)
        const stored = await files.put({ name: `${name}.png`, mime: 'image/png', bytes })
        return {
          key: `file:${stored.id}`,
          ...size,
          bytes: stored.size,
          wear: WEAR[kind](`file:${stored.id}`),
          ...(fileUrl ? { url: fileUrl(stored.id) } : {}),
        }
      },
    ),
  ]
}
