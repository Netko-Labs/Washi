import type { FileStore } from '@washi/repository'
import { z } from 'zod'
import { scaledPicture } from '../images'
import { capability } from './define'
import type { Capability, ContentAnswer } from './types'
import {
  FILE_GET_DESCRIPTION,
  FILE_GET_MAX_WIDTH,
  FILE_GET_MIN_WIDTH,
  FILE_GET_TEXT_CHARS,
  FILE_GET_WIDTH,
  SHOWN_AS_IS,
  SHOWN_AS_IS_BYTES,
  TEXT_TYPES,
} from './values'

const idOf = (key: string) => key.trim().replace(/^file:/, '')

const isText = (mime: string) => mime.startsWith('text/') || TEXT_TYPES.has(mime)

const words = (text: string): ContentAnswer => ({ content: [{ type: 'text', text }] })

/**
 * An upload as an agent looks at it (D138): a picture as a picture, drawn smaller to `maxWidth`
 * on its longer side; words as words; anything else as what it is. Only this workspace's uploads,
 * as any member reads them (the files route's gate).
 */
export function fileGetCapability(files: FileStore): Capability {
  return {
    ...capability(
      'file_get',
      FILE_GET_DESCRIPTION,
      {
        id: z.string().min(1).max(80).describe("The upload's key, file:<id> (or the bare id)"),
        maxWidth: z
          .number()
          .int()
          .min(FILE_GET_MIN_WIDTH)
          .max(FILE_GET_MAX_WIDTH)
          .optional()
          .describe(`A picture's longest side, in pixels; default ${FILE_GET_WIDTH}`),
      },
      true,
      async ({ id, maxWidth }): Promise<ContentAnswer> => {
        const key = `file:${idOf(id)}`
        const found = await files.get(idOf(id))
        if (!found) throw new Error(`${key} is not an upload in this workspace`)
        const { file, bytes } = found
        const about = { key, name: file.name, mime: file.mime, bytes: file.size }
        if (isText(file.mime)) {
          const text = new TextDecoder().decode(bytes)
          const cut = text.length > FILE_GET_TEXT_CHARS
          return words(
            cut
              ? `${text.slice(0, FILE_GET_TEXT_CHARS)}\n\n[Cut at ${FILE_GET_TEXT_CHARS} of ${text.length} characters.]`
              : text,
          )
        }
        if (file.mime.startsWith('image/')) {
          const shown = await scaledPicture(bytes, file.mime, maxWidth ?? FILE_GET_WIDTH)
          if (shown) {
            const scaled = shown.width !== shown.original.width
            const size = `${shown.original.width}×${shown.original.height}`
            return {
              content: [
                {
                  type: 'image',
                  data: Buffer.from(shown.bytes).toString('base64'),
                  mimeType: shown.mime,
                },
                {
                  type: 'text',
                  text: JSON.stringify({
                    ...about,
                    size,
                    ...(scaled ? { shownAt: `${shown.width}×${shown.height}` } : {}),
                  }),
                },
              ],
            }
          }
          if (SHOWN_AS_IS.has(file.mime) && bytes.byteLength <= SHOWN_AS_IS_BYTES) {
            return {
              content: [
                {
                  type: 'image',
                  data: Buffer.from(bytes).toString('base64'),
                  mimeType: file.mime,
                },
                { type: 'text', text: JSON.stringify(about) },
              ],
            }
          }
        }
        return words(
          JSON.stringify({
            ...about,
            shown: false,
            why: `a ${file.mime} upload cannot be shown here — pictures (PNG, JPEG, GIF; WebP up to ${SHOWN_AS_IS_BYTES / 1_000_000} MB) and text files can`,
          }),
        )
      },
    ),
    answersContent: true,
  }
}
