import type { Nodes, PhrasingContent } from 'mdast'
import type { Converting } from './types'
import { LINK_HREF } from './values'

const WORD = /[\p{L}\p{N}]/u
const isWord = (char: string | undefined) => char !== undefined && WORD.test(char)

/** A node's own Markdown, exactly as the document wrote it. */
export function sliceOf(node: Nodes, context: Converting): string {
  const start = node.position?.start.offset
  const end = node.position?.end.offset
  return start === undefined || end === undefined ? '' : context.markdown.slice(start, end)
}

/**
 * Words as plain text, safe from paper's inline marks: a `*`, `` ` ``, `[`, `]`, `\` or `~~` reads as
 * itself (a backslash before it), and an `_` only where it could open or close a mark — so
 * snake_case stays as typed.
 */
export function escapeText(value: string): string {
  let out = ''
  for (let at = 0; at < value.length; at++) {
    const char = value[at] ?? ''
    if ('\\`*[]'.includes(char)) out += `\\${char}`
    else if (char === '~' && (value[at + 1] === '~' || value[at - 1] === '~')) out += '\\~'
    else if (char === '_' && !(isWord(value[at - 1]) && isWord(value[at + 1]))) out += '\\_'
    else out += char
  }
  return out
}

/** `**a **` never closes: spaces move outside the mark, and an empty mark is no mark. */
function wrap(inner: string, mark: string): string {
  const trimmed = inner.trim()
  if (!trimmed) return inner
  const lead = inner.slice(0, inner.length - inner.trimStart().length)
  const trail = inner.slice(inner.trimEnd().length)
  return `${lead}${mark}${trimmed}${mark}${trail}`
}

/** A code span fenced longer than any run of backticks inside it. */
function codeSpan(value: string): string {
  const longest = Math.max(0, ...(value.match(/`+/g) ?? []).map((run) => run.length))
  const fence = '`'.repeat(longest + 1)
  const pad = value.startsWith('`') || value.endsWith('`') ? ' ' : ''
  return `${fence}${pad}${value}${pad}${fence}`
}

/**
 * A link as a page writes one: `[label](https://…)` where paper draws it; an anchor on the same
 * document keeps its words; any other address follows its words in brackets, never lost.
 */
export function linkOf(label: string, url: string): string {
  const href = url.trim().replace(/\(/g, '%28').replace(/\)/g, '%29')
  const words = label.replace(/(\\)?[[\]]/g, '').trim()
  if (LINK_HREF.test(href)) return `[${words || escapeText(href)}](${href})`
  if (!href || href.startsWith('#')) return words || escapeText(href)
  return words ? `${words} (${escapeText(href)})` : escapeText(href)
}

/** A reference link's address, from the document's definitions. */
const definedUrl = (identifier: string, context: Converting) =>
  context.definitions.get(identifier.toLowerCase())

function phraseOf(node: PhrasingContent, context: Converting): string {
  switch (node.type) {
    case 'text':
      return escapeText(node.value.replace(/[ \t]*\n[ \t]*/g, ' '))
    case 'strong':
      return wrap(inlineOf(node.children, context), '**')
    case 'emphasis':
      return wrap(inlineOf(node.children, context), '*')
    case 'delete':
      return wrap(inlineOf(node.children, context), '~~')
    case 'inlineCode':
      return codeSpan(node.value)
    case 'break':
      return '\n'
    case 'link':
      return linkOf(labelOf(node.children, context), node.url)
    case 'image':
      return linkOf(escapeText(node.alt ?? '') || 'image', node.url)
    case 'linkReference':
    case 'imageReference': {
      const url = definedUrl(node.identifier, context)
      if (!url) return escapeText(sliceOf(node, context))
      const label =
        node.type === 'linkReference'
          ? labelOf(node.children, context)
          : escapeText(node.alt ?? '') || 'image'
      return linkOf(label, url)
    }
    case 'html':
      if (/^<br\s*\/?>$/i.test(node.value.trim())) return '\n'
      // Nothing on a page draws inline HTML: its characters stay as visible words, and kept says so.
      context.kept.push(
        `inline html ${node.value.trim()} (line ${node.position?.start.line ?? '?'})`,
      )
      return escapeText(node.value)
    case 'footnoteReference':
      return escapeText(`[^${node.label ?? node.identifier}]`)
    default:
      return escapeText(sliceOf(node, context))
  }
}

/** A link's words: a picture inside one (a badge) is its alt, never a second link. */
function labelOf(nodes: PhrasingContent[], context: Converting): string {
  return nodes
    .map((node) =>
      node.type === 'image' || node.type === 'imageReference'
        ? escapeText(node.alt ?? '')
        : phraseOf(node, context),
    )
    .join('')
}

/** Phrasing content as paper's inline marks: **strong**, *em*, ~~strike~~, `code`, links. */
export function inlineOf(nodes: PhrasingContent[], context: Converting): string {
  return nodes.map((node) => phraseOf(node, context)).join('')
}

/** The words alone, no marks: a table's head, a heading become the page's title, a picture's alt. */
export function plainOf(node: Nodes): string {
  if ('value' in node && typeof node.value === 'string') {
    return node.type === 'html' ? '' : node.value
  }
  if (node.type === 'image' || node.type === 'imageReference') return node.alt ?? ''
  if ('children' in node) return node.children.map((child) => plainOf(child)).join('')
  return ''
}
