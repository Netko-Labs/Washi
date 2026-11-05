import { ELEMENT_NODE, type Node, parse, TEXT_NODE, transform } from 'ultrahtml'
import inline from 'ultrahtml/transformers/inline'
import { ImageRenderError } from './errors'
import type { FileInliner, SatoriNode } from './types'
import {
  BLOCK_TAGS,
  DROPPED_TAGS,
  FONT_ALIASES,
  MAX_HTML_CHARS,
  MAX_INLINED_FILES,
  MAX_NODES,
  RESOURCE_ATTRIBUTES,
} from './values'

const DATA_PICTURE = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=\s]+$/
const FILE_KEY = /^file:([a-z0-9-]{1,48})$/
const URL_CALL = /url\(\s*(['"]?)(.*?)\1\s*\)/g
const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  middot: '·',
  rarr: '→',
  larr: '←',
  copy: '©',
}

const decode = (text: string) =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name: string) => {
    if (name[0] === '#') {
      const code =
        name[1] === 'x' || name[1] === 'X'
          ? Number.parseInt(name.slice(2), 16)
          : Number(name.slice(1))
      return Number.isFinite(code) && code > 0 && code < 0x110000
        ? String.fromCodePoint(code)
        : whole
    }
    return ENTITIES[name.toLowerCase()] ?? whole
  })

const camel = (property: string) =>
  property
    .trim()
    .toLowerCase()
    .replace(
      /^-(webkit|moz|ms)-/,
      (_, vendor: string) => `${vendor[0]?.toUpperCase()}${vendor.slice(1)}-`,
    )
    .replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())

/** `a: b; c: url(data:…;base64,…)` split on the semicolons that end a declaration, not inside `()`. */
function declarations(style: string): [string, string][] {
  const out: [string, string][] = []
  let depth = 0
  let quote = ''
  let start = 0
  const push = (end: number) => {
    const part = style.slice(start, end)
    const colon = part.indexOf(':')
    if (colon > 0) out.push([part.slice(0, colon).trim(), part.slice(colon + 1).trim()])
    start = end + 1
  }
  for (let at = 0; at < style.length; at++) {
    const char = style[at]
    if (quote) {
      if (char === quote) quote = ''
    } else if (char === '"' || char === "'") quote = char
    else if (char === '(') depth++
    else if (char === ')') depth = Math.max(0, depth - 1)
    else if (char === ';' && depth === 0) push(at)
  }
  push(style.length)
  return out.filter(([property, value]) => property && value)
}

const refusedAddress = (where: string, address: string) =>
  new ImageRenderError(
    `${where} names "${address.slice(0, 80)}" — a picture here is a data:image/… address or file:<id> of an upload; nothing is fetched`,
  )

/** Pictures as markup names them, turned into `data:` addresses before layout, or refused. */
class Resources {
  // The lookup itself is kept, so siblings converted side by side read an upload once.
  private readonly inlined = new Map<string, Promise<string | null>>()
  private readonly inlineFile: FileInliner

  constructor(inlineFile: FileInliner) {
    this.inlineFile = inlineFile
  }

  async address(where: string, raw: string): Promise<string> {
    const address = raw.trim()
    if (DATA_PICTURE.test(address)) return address
    const id = FILE_KEY.exec(address)?.[1]
    if (!id) throw refusedAddress(where, address)
    let pending = this.inlined.get(id)
    if (!pending) {
      if (this.inlined.size >= MAX_INLINED_FILES) {
        throw new ImageRenderError(`a picture may show at most ${MAX_INLINED_FILES} uploads`)
      }
      pending = this.inlineFile(id)
      this.inlined.set(id, pending)
    }
    const data = await pending
    if (!data) {
      throw new ImageRenderError(`${where}: file:${id} is not a picture this workspace keeps`)
    }
    return data
  }

  async style(raw: string): Promise<Record<string, string>> {
    const out: Record<string, string> = {}
    for (const [property, value] of declarations(raw)) {
      let next = value.replace(/\s*!important\s*$/i, '')
      for (const [whole, , address = ''] of [...next.matchAll(URL_CALL)]) {
        next = next.replace(whole, `url(${await this.address(`a ${property}`, address)})`)
      }
      if (/\b(?:https?:)?\/\//i.test(next.replace(URL_CALL, '')))
        throw refusedAddress(property, next)
      out[camel(property)] =
        property.trim().toLowerCase() === 'font-family' ? fontFamily(next) : next
    }
    return out
  }
}

/** Generic families and the house names map to the fonts the server holds. */
function fontFamily(value: string): string {
  return value
    .split(',')
    .map((each) => each.trim().replace(/^['"]|['"]$/g, ''))
    .map((each) => FONT_ALIASES[each.toLowerCase()] ?? each)
    .concat('Washi Sans')
    .filter((each, at, all) => each && all.indexOf(each) === at)
    .join(', ')
}

const isBlank = (node: Node) => node.type === TEXT_NODE && !/\S/.test(node.value)

/**
 * A mockup's HTML as Satori lays it out (D126): `<style>` rules inlined, scripts, frames and links
 * dropped, every picture a `data:` address or an inlined upload — nothing is ever fetched. A
 * block with child elements and no display of its own stacks them, as a browser would.
 */
export async function markupOf(html: string, inlineFile: FileInliner): Promise<SatoriNode> {
  if (html.length > MAX_HTML_CHARS) {
    throw new ImageRenderError(
      `the markup is ${html.length} characters; a picture takes at most ${MAX_HTML_CHARS}`,
    )
  }
  const resources = new Resources(inlineFile)
  const document = parse(await transform(html, [inline()]))
  let count = 0

  const convert = async (node: Node): Promise<SatoriNode | string | null> => {
    if (++count > MAX_NODES) {
      throw new ImageRenderError(`the markup holds more than ${MAX_NODES} elements; draw less`)
    }
    if (node.type === TEXT_NODE) return decode(node.value.replace(/\s+/g, ' '))
    if (node.type !== ELEMENT_NODE) return null
    const tag = String(node.name).toLowerCase()
    if (DROPPED_TAGS.has(tag)) return null
    const props: Record<string, unknown> = {}
    for (const [name, value] of Object.entries(node.attributes as Record<string, string>)) {
      const key = name.toLowerCase()
      if (key === 'class' || key === 'id' || key.startsWith('on')) continue
      if (key === 'style') props.style = await resources.style(value)
      else if (RESOURCE_ATTRIBUTES.has(key))
        props[name] = await resources.address(`<${tag} ${name}>`, value)
      else props[name] = value
    }
    const kept = (node.children as Node[]).filter((child) => !isBlank(child))
    const children = (await Promise.all(kept.map(convert))).filter(
      (child): child is SatoriNode | string => child !== null && child !== '',
    )
    // Border-box, as a stylesheet's reset makes it: `width:100%` with padding stays inside its box.
    const style: Record<string, string> = {
      boxSizing: 'border-box',
      ...(props.style as Record<string, string>),
    }
    const stacks =
      BLOCK_TAGS.has(tag) && !style.display && children.some((child) => typeof child !== 'string')
    props.style = stacks ? { display: 'flex', flexDirection: 'column', ...style } : style
    if (children.length > 0) props.children = children.length === 1 ? children[0] : children
    return { type: tag === 'body' || tag === 'html' ? 'div' : tag, props }
  }

  const top = (
    await Promise.all((document.children as Node[]).filter((child) => !isBlank(child)).map(convert))
  ).filter((child): child is SatoriNode | string => child !== null && child !== '')
  // The whole picture is one box the size asked for; whatever the markup holds sits inside it.
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        fontFamily: 'Washi Sans',
      },
      children: top,
    },
  }
}
