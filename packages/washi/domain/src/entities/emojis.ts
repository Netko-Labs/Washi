import { z } from 'zod'

/** A shortcode is stored bare (`party-fox`) and shown as `:party-fox:`; colons typed around it are dropped. */
export const customEmojiNameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .transform((name) => name.replace(/^:+|:+$/g, ''))
  .pipe(
    z
      .string()
      .min(2, 'a name needs at least two characters')
      .max(32, 'a name is at most 32 characters')
      .regex(/^[a-z0-9_+-]+$/, 'a name is letters, numbers, - _ or + only'),
  )

export const customEmojiSchema = z.object({
  id: z.string(),
  name: z.string(),
  fileId: z.string(),
  createdBy: z.string(),
  hlcCreated: z.string(),
})
export type CustomEmoji = z.infer<typeof customEmojiSchema>

export const customEmojiWriteSchema = z.object({
  name: customEmojiNameSchema,
  fileId: z.string().min(1).max(64),
})
export type CustomEmojiWrite = z.infer<typeof customEmojiWriteSchema>
