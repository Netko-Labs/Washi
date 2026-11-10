import { Resvg } from '@resvg/resvg-wasm'
import { ELEMENT_NODE, type Node, TEXT_NODE } from 'ultrahtml'
import { engine } from './engine'
import { ImageRenderError } from './errors'
import type { AddressCheck, SvgPicture } from './types'
import {
  MAX_SIDE,
  SVG_DROPPED_TAGS,
  SVG_FAMILIES,
  SVG_RASTER_SIDE,
  SVG_SANS,
  SVG_SCALE,
  SVG_SERIF,
} from './values'

const URL_CALL = /url\(\s*(['"]?)(.*?)\1\s*\)/g
const PIXELS = /^\s*(\d+(?:\.\d+)?)\s*(px)?\s*$/
const LOCAL_REF = /^#[\w.:-]+$/

const attribute = (value: string) => value.replace(/"/g, '&quot;').replace(/</g, '&lt;')

/** A family list with the house names (and their generic aliases) as resvg knows them. */
const families = (value: string) =>
  value
    .split(',')
    .map((each) => each.trim().replace(/^['"]|['"]$/g, ''))
    .map((each) => SVG_FAMILIES[each.toLowerCase()] ?? each)
    .join(', ')

/** Every `url(…)` in a value: a `#ref` inside the drawing stays; anything else is a picture. */
async function urls(value: string, where: string, check: AddressCheck): Promise<string> {
  let next = value
  for (const [whole, , address = ''] of [...value.matchAll(URL_CALL)]) {
    if (LOCAL_REF.test(address.trim())) continue
    next = next.replace(whole, `url(${await check(where, address)})`)
  }
  return next
}

async function attributeValue(name: string, raw: string, tag: string, check: AddressCheck) {
  const key = name.toLowerCase()
  if (key === 'href' || key === 'xlink:href') {
    return LOCAL_REF.test(raw.trim()) ? raw.trim() : check(`<${tag} ${name}>`, raw)
  }
  if (key === 'font-family') return families(raw)
  const value = await urls(raw, `<${tag} ${name}>`, check)
  return key === 'style'
    ? value.replace(
        /font-family\s*:\s*([^;]+)/gi,
        (_, list: string) => `font-family:${families(list)}`,
      )
    : value
}

/**
 * One inline `<svg>` as its own source again, with only what may draw: no script, no HTML inside
 * it, no handler, every picture it names a `data:` address or an upload of the workspace's, and
 * `url(#id)` references kept, so clip paths, masks and gradients find what they point at.
 */
async function sourceOf(node: Node, check: AddressCheck, tick: () => void): Promise<string> {
  tick()
  if (node.type === TEXT_NODE) return String(node.value).replace(/</g, '&lt;')
  if (node.type !== ELEMENT_NODE) return ''
  const name = String(node.name)
  if (SVG_DROPPED_TAGS.has(name.toLowerCase())) return ''
  // A link draws as the group it holds: nothing in a picture is followed.
  const tag = name.toLowerCase() === 'a' ? 'g' : name
  const parts: string[] = []
  for (const [key, raw] of Object.entries(node.attributes as Record<string, string>)) {
    const lower = key.toLowerCase()
    if (lower.startsWith('on') || lower === 'class') continue
    if (name.toLowerCase() === 'a' && (lower === 'href' || lower === 'xlink:href')) continue
    parts.push(` ${key}="${attribute(await attributeValue(key, String(raw), tag, check))}"`)
  }
  const inner = (
    await Promise.all((node.children as Node[]).map((child) => sourceOf(child, check, tick)))
  ).join('')
  return inner ? `<${tag}${parts.join('')}>${inner}</${tag}>` : `<${tag}${parts.join('')}/>`
}

const pixels = (value: unknown) => {
  const found = typeof value === 'string' ? PIXELS.exec(value) : null
  return found ? Number(found[1]) : undefined
}

/** The size an `<svg>` says it is: its width and height, else its style's, else its viewBox. */
function sizeOf(attributes: Record<string, string>, style: Record<string, string>) {
  const box = (attributes.viewBox ?? attributes.viewbox ?? '')
    .trim()
    .split(/[\s,]+/)
    .map(Number)
  const [, , boxWidth, boxHeight] = box.length === 4 && box.every(Number.isFinite) ? box : []
  const width = pixels(attributes.width) ?? pixels(style.width) ?? boxWidth
  const height = pixels(attributes.height) ?? pixels(style.height) ?? boxHeight
  if (!width || !height) {
    throw new ImageRenderError(
      'an <svg> needs its size: width and height in px, or a viewBox (viewBox="0 0 64 64")',
    )
  }
  if (width > MAX_SIDE || height > MAX_SIDE) {
    throw new ImageRenderError(`an <svg> may be at most ${MAX_SIDE}px on a side`)
  }
  return { width, height }
}

/**
 * An inline `<svg>` drawn by resvg before layout (D138), as a PNG Satori places like an `<img>`:
 * Satori's own SVG reading drops clip paths, masks and gradients and refuses `<text>`; resvg draws
 * them all, its `<text>` in the house fonts. Drawn at twice its size for a sharp edge.
 */
export async function svgPicture(
  node: Node,
  style: Record<string, string>,
  check: AddressCheck,
  tick: () => void,
): Promise<SvgPicture> {
  const attributes = node.attributes as Record<string, string>
  // What it names is checked before anything else: a refused address says so first.
  const source = await sourceOf(node, check, tick)
  const { width, height } = sizeOf(attributes, style)
  // Its own size and namespace set on the root, so a viewBox alone still draws at that size.
  const rooted = source.replace(
    /^<svg\b[^>]*?(\/?)>/,
    (open, closes: string) =>
      `${open
        .slice(0, open.length - closes.length - 1)
        .replace(
          /\s(width|height|xmlns)="[^"]*"/g,
          '',
        )} xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"${closes}>`,
  )
  const scale = Math.min(SVG_SCALE, SVG_RASTER_SIDE / Math.max(width, height))
  const { fontBuffers } = await engine()
  try {
    const png = new Resvg(rooted, {
      fitTo: { mode: 'width', value: Math.max(1, Math.round(width * scale)) },
      font: {
        fontBuffers,
        loadSystemFonts: false,
        defaultFontFamily: SVG_SANS,
        sansSerifFamily: SVG_SANS,
        serifFamily: SVG_SERIF,
      },
    })
      .render()
      .asPng()
    return { src: `data:image/png;base64,${Buffer.from(png).toString('base64')}`, width, height }
  } catch (cause) {
    const said = cause instanceof Error ? cause.message : String(cause)
    throw new ImageRenderError(`an <svg> could not be drawn: ${said.split('\n')[0]}`)
  }
}
