import { describe, expect, test } from 'bun:test'
import { scaledPicture } from '..'

/** 30×20 red pictures, as ImageMagick writes them. */
const JPEG =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAAUAB4DAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAcJ/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AnRDGqYAAAAAAAAAAD//Z'
const GIF =
  'R0lGODlhHgAUAPAAAP8AAAAAACH5BAAAAAAALAAAAAAeABQAAAIXhI+py+0Po5y02ouz3rz7D4biSJZmUgAAOw=='

const bytesOf = (base64: string) => new Uint8Array(Buffer.from(base64, 'base64'))
const pngSize = (bytes: Uint8Array) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  return { width: view.getUint32(16), height: view.getUint32(20) }
}

describe('a picture drawn smaller for an agent to look at (D138)', () => {
  test('a JPEG and a GIF that fit come back as stored, with their size read off the header', async () => {
    for (const [base64, mime] of [
      [JPEG, 'image/jpeg'],
      [GIF, 'image/gif'],
    ] as const) {
      const bytes = bytesOf(base64)
      const shown = await scaledPicture(bytes, mime, 64)
      expect(shown).toMatchObject({ mime, width: 30, height: 20 })
      expect(shown?.bytes).toBe(bytes)
    }
  })

  test('a larger one is drawn smaller as a PNG, keeping its shape', async () => {
    const shown = await scaledPicture(bytesOf(JPEG), 'image/jpeg', 15)
    expect(shown).toMatchObject({ mime: 'image/png', width: 15, height: 10 })
    expect(pngSize(shown?.bytes ?? new Uint8Array())).toEqual({ width: 15, height: 10 })
    expect(shown?.original).toEqual({ width: 30, height: 20 })
  })

  test('a picture resvg cannot read is left to the caller', async () => {
    expect(await scaledPicture(bytesOf(GIF), 'image/webp', 64)).toBeNull()
    expect(await scaledPicture(new Uint8Array([1, 2, 3]), 'image/png', 64)).toBeNull()
  })
})
