import { Resvg } from '@resvg/resvg-wasm'
import satori from 'satori'
import { engine } from './engine'
import { ImageRenderError } from './errors'
import { markupOf } from './html'
import type { FileInliner, RenderRequest } from './types'

/**
 * HTML drawn to a PNG on the server (D126): Satori lays it out (flexbox, the CSS it knows, the
 * house fonts), resvg rasterizes it. No browser, no script, no network — pictures come only from
 * `data:` addresses and the workspace's own uploads. An inline `<svg>` is drawn by resvg whole
 * before layout (D138), so clip paths, masks, gradients and its `<text>` draw as SVG says.
 */
export async function renderHtml(
  request: RenderRequest,
  inlineFile: FileInliner,
): Promise<Uint8Array> {
  const [{ fonts }, markup] = await Promise.all([engine(), markupOf(request.html, inlineFile)])
  let svg: string
  try {
    svg = await satori(markup as never, { width: request.width, height: request.height, fonts })
  } catch (cause) {
    const said = cause instanceof Error ? cause.message : String(cause)
    throw new ImageRenderError(`the markup could not be laid out: ${said.split('\n')[0]}`)
  }
  return new Resvg(svg, { fitTo: { mode: 'original' } }).render().asPng()
}
