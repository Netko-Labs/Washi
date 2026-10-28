import type { ComponentSpec } from '@washi/wsx'
import { z } from 'zod'
import { FILE_KEY } from './looks'
import { p } from './spec-kit'

/** An https address, or an upload the workspace holds as `file:<id>`. */
export const mediaSrcSchema = z
  .string()
  .refine((src) => FILE_KEY.test(src) || /^https:\/\/[^\s]+$/.test(src), {
    message: 'a src is an https url or file:<id>',
  })

const ratio = z.enum(['16:9', '4:3', '3:2', '1:1']).optional()

/** What a page plays or hands over: a video, a sound, a document. */
export const MEDIA_SPECS: Record<string, ComponentSpec> = {
  Video: p(
    {
      src: mediaSrcSchema,
      title: z.string().max(120).optional(),
      poster: mediaSrcSchema.optional(),
      ratio,
    },
    'none',
    {
      hints: { url: 'the address is src: https or file:<id>' },
    },
  ),
  Audio: p({ src: mediaSrcSchema, title: z.string().max(120).optional() }, 'none'),
  File: p(
    {
      src: mediaSrcSchema,
      name: z.string().min(1).max(200),
      bytes: z.number().int().min(0).optional(),
    },
    'none',
  ),
}
