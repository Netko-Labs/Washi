export type UploadKind = 'image' | 'video' | 'audio' | 'file'

export interface UploadRule {
  mimes: readonly string[]
  maxBytes: number
  /** What a refusal calls the kind: "pictures up to 10 MB". */
  noun: string
}

/** Bytes each kind may take. */
export type UploadCaps = Record<UploadKind, number>

/** Inclusive offsets, or a range wholly past the end of the file. */
export type ByteRange = { start: number; end: number } | 'unsatisfiable'
