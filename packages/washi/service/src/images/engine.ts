import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { initWasm } from '@resvg/resvg-wasm'
import { sfntOf } from './sfnt'
import type { Engine } from './types'
import { FONT_FILES } from './values'

const require = createRequire(import.meta.url)

let ready: Promise<Engine> | null = null

/**
 * The rasterizer's wasm and the house fonts, read off disk once per process copy: as WOFF for
 * Satori, and unwrapped to sfnt for resvg (an inline `<svg>`'s `<text>`, D138).
 */
export function engine(): Promise<Engine> {
  if (ready) return ready
  const loading = (async (): Promise<Engine> => {
    await initWasm(readFileSync(require.resolve('@resvg/resvg-wasm/index_bg.wasm')))
    const files = FONT_FILES.map((font) => ({
      ...font,
      bytes: readFileSync(require.resolve(font.file)),
    }))
    return {
      fonts: files.map(({ name, weight, bytes }) => ({
        name,
        weight,
        style: 'normal' as const,
        data: bytes,
      })),
      fontBuffers: files.map(({ bytes }) => sfntOf(new Uint8Array(bytes))),
    }
  })()
  ready = loading
  // A load that failed is tried again on the next picture, not remembered as the answer.
  loading.catch(() => {
    ready = null
  })
  return loading
}
