import { describe, expect, test } from 'bun:test'
import {
  byteRange,
  contentDisposition,
  isInlineType,
  uploadKindOf,
  uploadName,
  uploadRefusal,
} from '../index'

const MB = 1024 * 1024

describe('what a workspace takes as an upload', () => {
  test('pictures, videos, sounds and documents, each within its own limit', () => {
    expect(uploadKindOf('video/mp4')).toBe('video')
    expect(uploadKindOf('audio/mpeg; codecs=mp3')).toBe('audio')
    expect(uploadRefusal('image/png', 9 * MB)).toBeNull()
    expect(uploadRefusal('image/png', 11 * MB)).toBe('pictures up to 10 MB')
    expect(uploadRefusal('video/mp4', 60 * MB)).toBe('videos up to 50 MB')
    expect(uploadRefusal('application/pdf', 1 * MB)).toBeNull()
  })

  test('nothing that could run when served: no HTML, no SVG', () => {
    expect(uploadRefusal('text/html', 10)).toBe('that kind of file is not taken')
    expect(uploadRefusal('image/svg+xml', 10)).toBe('that kind of file is not taken')
  })

  test('a cover asks for a picture and refuses a video in words', () => {
    expect(uploadRefusal('video/mp4', 10, 'image')).toBe('pictures only')
  })

  test('media and PDFs show inline; the rest download', () => {
    expect(isInlineType('video/webm')).toBe(true)
    expect(isInlineType('application/pdf')).toBe(true)
    expect(isInlineType('application/zip')).toBe(false)
  })

  test('a player’s byte range, clamped to the file; nonsense sends the whole of it', () => {
    expect(byteRange('bytes=0-99', 1000)).toEqual({ start: 0, end: 99 })
    expect(byteRange('bytes=900-', 1000)).toEqual({ start: 900, end: 999 })
    expect(byteRange('bytes=-100', 1000)).toEqual({ start: 900, end: 999 })
    expect(byteRange('bytes=0-5000', 1000)).toEqual({ start: 0, end: 999 })
    expect(byteRange('bytes=9-2', 1000)).toBeNull()
    expect(byteRange('bytes=1-2, 4-5', 1000)).toBeNull()
    expect(byteRange(null, 1000)).toBeNull()
  })

  test('a range wholly past the end is unsatisfiable, never the whole file', () => {
    expect(byteRange('bytes=999999999-', 25_000)).toBe('unsatisfiable')
    expect(byteRange('bytes=1000-2000', 1000)).toBe('unsatisfiable')
    expect(byteRange('bytes=-0', 1000)).toBe('unsatisfiable')
  })

  test('an empty file is refused in words, before it uploads', () => {
    expect(uploadRefusal('image/png', 0)).toBe('that file is empty')
    expect(uploadRefusal('image/svg+xml', 0)).toBe('that kind of file is not taken')
  })
})

describe('the name an upload keeps', () => {
  test('a browser’s escapes decoded once; no path, no control characters', () => {
    expect(uploadName('a%22b<c>.png')).toBe('a"b<c>.png')
    expect(uploadName('a\\"b.png')).toBe('a"b.png')
    expect(uploadName('../../x.png')).toBe('x.png')
    expect(uploadName('C:\\Users\\me\\x.png')).toBe('x.png')
    expect(uploadName('line%0D%0Abreak\u0007.png')).toBe('linebreak.png')
    expect(uploadName('100%25 done.pdf')).toBe('100%25 done.pdf')
    expect(uploadName(undefined)).toBe('file')
    expect(uploadName('../..')).toBe('file')
  })

  test('served as RFC 5987 with a plain ASCII fallback beside it', () => {
    expect(contentDisposition('a"b<c>.png', true)).toBe(
      `inline; filename="a_b<c>.png"; filename*=UTF-8''a%22b%3Cc%3E.png`,
    )
    expect(contentDisposition("Café (v2)'s.pdf", false)).toBe(
      `attachment; filename="Caf_ (v2)'s.pdf"; filename*=UTF-8''Caf%C3%A9%20%28v2%29%27s.pdf`,
    )
  })
})
