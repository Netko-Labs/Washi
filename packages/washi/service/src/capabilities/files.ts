import { uploadCaps, uploadName, uploadRefusal } from '@washi/domain'
import type { FileStore, Workspace } from '@washi/repository'
import { z } from 'zod'
import { codeLimits } from '../server'
import { capability } from './define'
import type { Capability } from './types'
import { MAX_BASE64_CHARS, MIME_BY_EXTENSION } from './values'

const typeOf = (filename: string) =>
  MIME_BY_EXTENSION[filename.split('.').pop()?.toLowerCase() ?? '']

/**
 * An upload as an outside agent makes one: bytes in base64, landing in the workspace's files like
 * a picker's, under the same rules (D95) and the server's caps (D118). Its key wears anywhere a
 * page takes `file:<id>` — an icon, a cover, a Figure.
 */
export function fileCapabilities(
  ws: Workspace,
  files: FileStore,
  fileUrl?: (id: string) => string,
): Capability[] {
  return [
    capability(
      'file_upload',
      "Upload a file into the workspace: base64 bytes, its filename, and contentType (read off the filename when left out). Pictures (png, jpeg, webp, gif, avif) up to 10 MB, videos 50 MB, audio and documents (pdf, txt, csv, md, json, zip, docx, xlsx, pptx) 25 MB unless the server says otherwise; never HTML or SVG — make an SVG a PNG first. Answers { key: 'file:<id>', … }: set it as a Sheet's icon or cover, a Figure's or a Video's src, a File's src.",
      {
        base64: z.string().min(1).max(MAX_BASE64_CHARS),
        filename: z.string().min(1).max(200),
        contentType: z.string().min(1).max(120).optional(),
      },
      false,
      async ({ base64, filename, contentType }) => {
        const mime = contentType ?? typeOf(filename)
        if (!mime) {
          throw new Error(`what kind of file is "${filename}"? Pass contentType, like image/png`)
        }
        const bytes = new Uint8Array(Buffer.from(base64, 'base64'))
        const refusal = uploadRefusal(mime, bytes.byteLength, undefined, uploadCaps(codeLimits(ws)))
        if (refusal) {
          throw new Error(
            mime === 'image/svg+xml'
              ? `${refusal}: SVG can run when served — upload a PNG`
              : refusal,
          )
        }
        const stored = await files.put({ name: uploadName(filename), mime, bytes })
        return {
          key: `file:${stored.id}`,
          ...stored,
          ...(fileUrl ? { url: fileUrl(stored.id) } : {}),
        }
      },
    ),
  ]
}
