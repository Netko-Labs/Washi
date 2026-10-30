import type { UploadCaps, UploadKind, UploadRule } from './types'

export const MB = 1024 * 1024

/**
 * What a workspace takes as an upload. Never HTML or SVG: a file served from the studio's own
 * origin must not be able to run.
 */
export const UPLOAD_RULES: Record<UploadKind, UploadRule> = {
  image: {
    mimes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
    maxBytes: 10 * MB,
    noun: 'pictures',
  },
  video: {
    mimes: ['video/mp4', 'video/webm', 'video/quicktime'],
    maxBytes: 50 * MB,
    noun: 'videos',
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
    noun: 'audio',
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
    noun: 'files',
  },
}

/** Today's caps per kind, the server's own when its admin set none (D118). */
export const UPLOAD_CAPS: UploadCaps = {
  image: UPLOAD_RULES.image.maxBytes,
  video: UPLOAD_RULES.video.maxBytes,
  audio: UPLOAD_RULES.audio.maxBytes,
  file: UPLOAD_RULES.file.maxBytes,
}
