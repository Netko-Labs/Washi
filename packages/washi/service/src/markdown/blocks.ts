import type { WsxElement, WsxNode, WsxValue } from '@washi/wsx'
import type {
  Blockquote,
  Code,
  Heading,
  List,
  ListItem,
  Paragraph,
  RootContent,
  Table,
} from 'mdast'
import { inlineOf, plainOf, sliceOf } from './inline'
import type { Converting } from './types'
import {
  ALERT_MARKER,
  ALERTS,
  CODE_LANG,
  FIGURE_ALT_CHARS,
  TABLE_CELL_CHARS,
  TABLE_COLUMN_CHARS,
  TABLE_MAX_COLUMNS,
  TABLE_MAX_ROWS,
} from './values'

export const el = (
  name: string,
  props: Record<string, WsxValue> = {},
  children: WsxNode[] = [],
): WsxElement => ({ kind: 'element', name, props, children })

export const words = (value: string): WsxNode[] => (value ? [{ kind: 'text', value }] : [])

/** Markdown nothing on a page draws, kept exactly as written in a Code block — never dropped. */
function kept(node: RootContent, context: Converting, lang = 'markdown'): WsxNode[] {
  const source = sliceOf(node, context).trim()
  if (!source) return []
  context.kept.push(`${node.type} (line ${node.position?.start.line ?? '?'})`)
  return [el('Code', { lang }, words(source))]
}

function headingOf(node: Heading, context: Converting): WsxNode[] {
  const text = inlineOf(node.children, context).trim()
  return text ? [el('Title', { level: Math.min(node.depth, 3) }, words(text))] : []
}

/** A paragraph that is one picture alone, on https: a Figure. */
function figureOf(node: Paragraph): WsxElement | null {
  const shown = node.children.filter((child) => !(child.type === 'text' && !child.value.trim()))
  const [only] = shown
  if (shown.length !== 1 || only?.type !== 'image' || !only.url.startsWith('https://')) return null
  const alt = (only.alt?.trim() || only.url.split('/').pop() || 'Picture').slice(
    0,
    FIGURE_ALT_CHARS,
  )
  const caption = only.title?.trim().slice(0, FIGURE_ALT_CHARS)
  return el('Figure', { src: only.url, alt, ...(caption ? { caption } : {}) })
}

function paragraphOf(node: Paragraph, context: Converting): WsxNode[] {
  const figure = figureOf(node)
  if (figure) return [figure]
  const text = inlineOf(node.children, context).trim()
  return text ? [el('Text', {}, words(text))] : []
}

function codeOf(node: Code): WsxNode[] {
  const props: Record<string, WsxValue> =
    node.lang && CODE_LANG.test(node.lang) ? { lang: node.lang } : {}
  return [el('Code', props, words(node.value))]
}

/** A list item's words sit in it directly; what follows them — a nested list, code — as blocks. */
function itemOf(node: ListItem, context: Converting): WsxElement {
  const [first, ...rest] = node.children
  const head =
    first?.type === 'paragraph' && !figureOf(first)
      ? words(inlineOf(first.children, context).trim())
      : first
        ? blockOf(first, context)
        : []
  const done: Record<string, WsxValue> = node.checked === true ? { done: true } : {}
  return el('Item', done, [...head, ...rest.flatMap((child) => blockOf(child, context))])
}

function listOf(node: List, context: Converting): WsxNode[] {
  const isCheck = node.children.some((item) => typeof item.checked === 'boolean')
  const marker = isCheck ? 'check' : node.ordered ? 'number' : 'bullet'
  return [
    el(
      'List',
      { marker },
      node.children.map((item) => itemOf(item, context)),
    ),
  ]
}

/** Heads a written Table can take: words, ≤ 64 characters, each one its own. */
function headsOf(cells: string[]): string[] {
  const seen = new Set<string>()
  return cells.map((cell, at) => {
    const base = (cell.trim() || `Column ${at + 1}`).slice(0, TABLE_COLUMN_CHARS - 3)
    let name = base
    for (let n = 2; seen.has(name); n++) name = `${base} ${n}`
    seen.add(name)
    return name
  })
}

/** A pipe table as written Tables, 200 rows each; wider than paper takes, it stays Markdown. */
function tableOf(node: Table, context: Converting): WsxNode[] {
  const [head, ...body] = node.children
  if (!head || head.children.length > TABLE_MAX_COLUMNS) return kept(node, context)
  const columns = headsOf(head.children.map((cell) => plainOf(cell)))
  const rows = body.map((row) =>
    row.children
      .slice(0, columns.length)
      .map((cell) => inlineOf(cell.children, context).trim() || null),
  )
  const isTooLong = rows.some((row) => row.some((cell) => (cell?.length ?? 0) > TABLE_CELL_CHARS))
  if (isTooLong) return kept(node, context)
  if (rows.length === 0) return [el('Table', { columns, rows: [] })]
  const tables: WsxNode[] = []
  for (let at = 0; at < rows.length; at += TABLE_MAX_ROWS) {
    tables.push(el('Table', { columns, rows: rows.slice(at, at + TABLE_MAX_ROWS) }))
  }
  return tables
}

/** Blocks inside a quote or a callout: one paragraph is its words, more are blocks. */
function insideOf(children: RootContent[], context: Converting): WsxNode[] {
  const [only] = children
  if (children.length === 1 && only?.type === 'paragraph' && !figureOf(only)) {
    return words(inlineOf(only.children, context).trim())
  }
  return children.flatMap((child) => blockOf(child, context))
}

/** `> [!WARNING]` is GitHub's alert, a Callout; any other quote is a Quote. */
function quoteOf(node: Blockquote, context: Converting): WsxNode[] {
  const [first, ...rest] = node.children
  const lead = first?.type === 'paragraph' ? first.children[0] : undefined
  const marker = lead?.type === 'text' ? ALERT_MARKER.exec(lead.value) : null
  if (first?.type !== 'paragraph' || lead?.type !== 'text' || !marker) {
    return [el('Quote', {}, insideOf(node.children, context))]
  }
  const alert = ALERTS[(marker[1] ?? '').toUpperCase()] ?? { tone: 'info', title: 'Note' }
  const remaining = [
    { ...lead, value: lead.value.slice(marker[0].length) },
    ...first.children.slice(1),
  ]
  const stripped: Paragraph = { ...first, children: remaining }
  const body = plainOf(stripped).trim() ? [stripped, ...rest] : rest
  return [el('Callout', { tone: alert.tone, title: alert.title }, insideOf(body, context))]
}

/** One Markdown block as page blocks: none for a link definition (its links carry it). */
export function blockOf(node: RootContent, context: Converting): WsxNode[] {
  switch (node.type) {
    case 'heading':
      return headingOf(node, context)
    case 'paragraph':
      return paragraphOf(node, context)
    case 'list':
      return listOf(node, context)
    case 'code':
      return codeOf(node)
    case 'table':
      return tableOf(node, context)
    case 'blockquote':
      return quoteOf(node, context)
    case 'thematicBreak':
      return [el('Divider')]
    case 'html':
      return kept(node, context, 'html')
    case 'definition':
      return []
    default:
      return kept(node, context)
  }
}
