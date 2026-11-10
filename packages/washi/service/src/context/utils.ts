import type { WsxNode, WsxValue } from '@washi/wsx'
import type { RenderContext } from './types'
import { CELL_CHARS, INLINE } from './values'

/** Text cut to a length, with an ellipsis when it was cut. */
export const cut = (text: string, chars: number) =>
  text.length > chars ? `${text.slice(0, Math.max(0, chars - 1)).trimEnd()}…` : text

/** One line of words: runs of whitespace (newlines included) read as one space. */
export const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim()

/** A prop as words, when it is words. */
export const word = (value: WsxValue | undefined): string | null =>
  typeof value === 'string' && value.trim()
    ? value.trim()
    : typeof value === 'number'
      ? String(value)
      : null

/** A cell's value in a row line or a pipe table: one line, `|` escaped, cut. */
export function cell(value: unknown, chars = CELL_CHARS): string {
  if (value === null || value === undefined || value === '') return ''
  const text = Array.isArray(value)
    ? value
        .map((each) => (typeof each === 'object' ? JSON.stringify(each) : String(each)))
        .join(', ')
    : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value)
  return cut(oneLine(text), chars).replace(/\|/g, '\\|')
}

/** Whether children read as one paragraph: words and inline marks, no blocks. */
export const isInlineRun = (children: WsxNode[]) =>
  children.every(
    (child) => child.kind !== 'element' || INLINE.has(child.name) || child.name === 'Ref',
  )

/** Children as one run of words, inline marks kept as Markdown. */
export function inlineOf(children: WsxNode[], ctx: RenderContext): string {
  return oneLine(children.map((child) => inlineNode(child, ctx)).join(''))
}

function inlineNode(node: WsxNode, ctx: RenderContext): string {
  if (node.kind === 'text') return node.value
  if (node.kind === 'code') return '{…}'
  const words = inlineOf(node.children, ctx)
  switch (node.name) {
    case 'Kbd':
      return `\`${words}\``
    case 'Mark':
      return `**${words}**`
    case 'Ref': {
      const id = word(node.props.sheet)
      return id ? `[${words || ctx.titles.get(id) || 'a page'}](sheet:${id})` : words
    }
    case 'Money':
      return [word(node.props.value) ?? word(node.props.expr), word(node.props.currency)]
        .filter(Boolean)
        .join(' ')
    case 'Avatar':
      return word(node.props.label) ?? ''
    default:
      return words || word(node.props.expr) || ''
  }
}

/** A filter in words: `status ne Done`, joined with "and". */
export function whereWords(where: WsxValue | undefined): string | null {
  if (!Array.isArray(where) || where.length === 0) return null
  const parts = where.flatMap((each) => {
    if (!each || typeof each !== 'object' || Array.isArray(each)) return []
    const { column, op, value } = each as Record<string, WsxValue>
    const shown = typeof value === 'object' && value !== null ? JSON.stringify(value) : value
    return [`${String(column)} ${String(op)} ${String(shown)}`]
  })
  return parts.length ? parts.join(' and ') : null
}
