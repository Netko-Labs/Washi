import { describe, expect, test } from 'bun:test'
import { byteRange, isInlineType, uploadKindOf, uploadRefusal } from '../index'

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
    expect(byteRange('bytes=2000-', 1000)).toBeNull()
    expect(byteRange(null, 1000)).toBeNull()
  })
})
