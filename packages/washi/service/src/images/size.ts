import type { PictureSize } from './types'

const JPEG_FRAMES = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
])

function jpegSize(view: DataView): PictureSize | null {
  let at = 2
  while (at + 9 < view.byteLength) {
    if (view.getUint8(at) !== 0xff) return null
    const marker = view.getUint8(at + 1)
    if (JPEG_FRAMES.has(marker)) {
      return { height: view.getUint16(at + 5), width: view.getUint16(at + 7) }
    }
    at += 2 + view.getUint16(at + 2)
  }
  return null
}

/** A picture's own width and height, read off its header: PNG, JPEG or GIF; null for any other. */
export function pictureSize(bytes: Uint8Array, mime: string): PictureSize | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  try {
    if (mime === 'image/png' && bytes.byteLength >= 24) {
      return { width: view.getUint32(16), height: view.getUint32(20) }
    }
    if (mime === 'image/gif' && bytes.byteLength >= 10) {
      return { width: view.getUint16(6, true), height: view.getUint16(8, true) }
    }
    if (mime === 'image/jpeg') return jpegSize(view)
  } catch {
    return null
  }
  return null
}
