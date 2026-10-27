import { z } from 'zod'

const trimmed = (max: number) => z.string().trim().min(1).max(max)

/** A workspace's own S3-compatible bucket, as an owner types it in. */
export const storageConfigSchema = z.object({
  endpoint: z
    .string()
    .trim()
    .pipe(z.url({ protocol: /^https?$/, error: 'an http or https address' })),
  region: trimmed(64),
  bucket: trimmed(255),
  prefix: z
    .string()
    .trim()
    .max(200)
    .nullish()
    .transform((value) => value?.replace(/^\/+|\/+$/g, '') || null),
  accessKeyId: trimmed(256),
  secretAccessKey: trimmed(512),
})

export type StorageConfig = z.output<typeof storageConfigSchema>

/** What anyone in the workspace may read back: never the secret, the key id only by its last four. */
export interface StorageInfo {
  endpoint: string
  region: string
  bucket: string
  prefix: string | null
  accessKeyLast4: string
  updatedAt: Date
  updatedBy: string | null
}
