import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { initWasm, Resvg } from '@resvg/resvg-wasm'
import satori from 'satori'
import { ImageRenderError } from './errors'
import { markupOf } from './html'
import type { FileInliner, RenderRequest } from './types'
import { FONT_FILES } from './values'

const require = createRequire(import.meta.url)

type Fonts = Parameters<typeof satori>[1]['fonts']

let ready: Promise<Fonts> | null = null

/** The rasterizer's wasm and the house fonts, read off disk once per process copy. */
function prepared(): Promise<Fonts> {
  ready ??= (async () => {
    await initWasm(readFileSync(require.resolve('@resvg/resvg-wasm/index_bg.wasm')))
    return FONT_FILES.map(({ name, weight, file }) => ({
      name,
      weight,
      style: 'normal' as const,
      data: readFileSync(require.resolve(file)),
    }))
  })()
  // A load that failed is tried again on the next picture, not remembered as the answer.
  ready.catch(() => {
    ready = null
  })
  return ready
}

/**
 * HTML drawn to a PNG on the server (D126): Satori lays it out (flexbox, the CSS it knows, the
 * house fonts), resvg rasterizes it. No browser, no script, no network — pictures come only from
 * `data:` addresses and the workspace's own uploads.
 */
export async function renderHtml(
  request: RenderRequest,
  inlineFile: FileInliner,
): Promise<Uint8Array> {
  const [fonts, markup] = await Promise.all([prepared(), markupOf(request.html, inlineFile)])
  let svg: string
  try {
    svg = await satori(markup as never, { width: request.width, height: request.height, fonts })
  } catch (cause) {
    const said = cause instanceof Error ? cause.message : String(cause)
    throw new ImageRenderError(`the markup could not be laid out: ${said.split('\n')[0]}`)
  }
  return new Resvg(svg, { fitTo: { mode: 'original' } }).render().asPng()
}
