export type UploadKind = 'image' | 'video' | 'audio' | 'file'

export interface UploadRule {
  mimes: readonly string[]
  maxBytes: number
  /** The limit in words, as a refusal says it. */
  limit: string
}
