import type { UploadKind, UploadRule } from './types'

const MB = 1024 * 1024

/**
 * What a workspace takes as an upload. Never HTML or SVG: a file served from the studio's own
 * origin must not be able to run.
 */
export const UPLOAD_RULES: Record<UploadKind, UploadRule> = {
  image: {
    mimes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
    maxBytes: 10 * MB,
    limit: 'pictures up to 10 MB',
  },
  video: {
    mimes: ['video/mp4', 'video/webm', 'video/quicktime'],
    maxBytes: 50 * MB,
    limit: 'videos up to 50 MB',
  },
  audio: {
    mimes: [
      'audio/mpeg',
      'audio/mp4',
      'audio/x-m4a',
      'audio/aac',
      'audio/ogg',
      'audio/wav',
      'audio/x-wav',
      'audio/webm',
      'audio/flac',
    ],
    maxBytes: 25 * MB,
    limit: 'audio up to 25 MB',
  },
  file: {
    mimes: [
      'application/pdf',
      'text/plain',
      'text/csv',
      'text/markdown',
      'application/json',
      'application/zip',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    maxBytes: 25 * MB,
    limit: 'files up to 25 MB',
  },
}

/** The largest upload of any kind: the body cap, read before the form is. */
export const UPLOAD_MAX_BYTES = Math.max(
  ...Object.values(UPLOAD_RULES).map((rule) => rule.maxBytes),
)
