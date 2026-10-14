import type { SheetFrame } from '@washi/paper'
import type { WsxElement, WsxNode, WsxValue } from '@washi/wsx'
import type { ComponentProps } from 'react'
import type { Block, KindOption, TextBlock, TextKind } from './types'
import { KIND_OPTIONS, LIST_MARKERS, SHORTCUTS } from './values'

const HEADINGS: Partial<Record<TextKind, number>> = { h1: 1, h2: 2, h3: 3 }

function element(name: string, props: Record<string, WsxValue>, children: WsxNode[]): WsxElement {
  return { kind: 'element', name, props, children }
}

function text(value: string): WsxNode[] {
  return value ? [{ kind: 'text', value }] : []
}

/** A block's text when every child is text (or one plain `<Text>`); null when it holds more. */
function plainText(node: WsxElement): string | null {
  if (node.children.every((child) => child.kind === 'text')) {
    return node.children.map((child) => (child.kind === 'text' ? child.value : '')).join(' ')
  }
  const [only] = node.children
  if (node.children.length === 1 && only?.kind === 'element' && only.name === 'Text') {
    return plainText(only)
  }
  return null
}

export function newBlock(kind: TextKind = 'text', value = ''): TextBlock {
  return { id: crypto.randomUUID(), kind, text: value, props: {} }
}

export function turnInto(block: TextBlock, kind: TextKind): TextBlock {
  return { id: block.id, kind, text: kind === 'divider' ? '' : block.text, props: {} }
}

function locked(node: WsxElement): Block {
  return { id: crypto.randomUUID(), kind: 'locked', node }
}

function fromList(node: WsxElement): Block[] {
  const marker = node.props.marker
  const kind: TextKind = marker === 'number' ? 'number' : marker === 'check' ? 'todo' : 'bullet'
  const items = node.children.map((item) =>
    item.kind === 'element' && item.name === 'Item' ? { item, value: plainText(item) } : null,
  )
  if (items.some((entry) => entry === null || entry.value === null)) return [locked(node)]
  return items.map((entry) => {
    const { done, ...props } = entry?.item.props ?? {}
    return { ...newBlock(kind, entry?.value ?? ''), done: done === true, props }
  })
}

function fromElement(node: WsxElement): Block[] {
  if (node.name === 'List') return fromList(node)
  if (node.name === 'Divider') return [{ ...newBlock('divider'), props: node.props }]
  if (node.name === 'Code') {
    const value = node.children.map((child) => (child.kind === 'text' ? child.value : '')).join('')
    return [{ ...newBlock('code', value), props: node.props }]
  }
  const value = plainText(node)
  if (value === null) return [locked(node)]
  if (node.name === 'Title') {
    const { level, ...props } = node.props
    const kind: TextKind = level === 2 ? 'h2' : level === 3 ? 'h3' : 'h1'
    return [{ ...newBlock(kind, value), props }]
  }
  const kinds: Record<string, TextKind> = { Text: 'text', Quote: 'quote', Callout: 'callout' }
  const kind = kinds[node.name]
  return kind ? [{ ...newBlock(kind, value), props: node.props }] : [locked(node)]
}

/** The sheet's top level as blocks: text a person can type into, anything else kept whole. */
export function toBlocks(root: WsxElement): Block[] {
  return root.children.flatMap((node) =>
    node.kind === 'text' ? [newBlock('text', node.value)] : fromElement(node),
  )
}

function toNode(block: TextBlock): WsxElement | null {
  if (block.kind === 'divider') return element('Divider', block.props, [])
  if (block.kind === 'code') return element('Code', block.props, text(block.text))
  if (!block.text.trim()) return null
  const level = HEADINGS[block.kind]
  if (level)
    return element('Title', level > 1 ? { ...block.props, level } : block.props, text(block.text))
  const names: Partial<Record<TextKind, string>> = {
    text: 'Text',
    quote: 'Quote',
    callout: 'Callout',
  }
  return element(names[block.kind] ?? 'Text', block.props, text(block.text))
}

/** Blocks back into the sheet: neighbouring list items of one kind share a `<List>`; empty text is dropped. */
export function toSheet(root: WsxElement, blocks: Block[]): WsxElement {
  const children: WsxNode[] = []
  let list: WsxElement | null = null
  for (const block of blocks) {
    if (block.kind === 'locked') {
      list = null
      children.push(block.node)
      continue
    }
    const marker = LIST_MARKERS[block.kind]
    if (!marker) {
      list = null
      const node = toNode(block)
      if (node) children.push(node)
      continue
    }
    if (!block.text.trim()) continue
    if (!list || list.props.marker !== marker) {
      list = element('List', { marker }, [])
      children.push(list)
    }
    const props = block.kind === 'todo' && block.done ? { ...block.props, done: true } : block.props
    list.children.push(element('Item', props, text(block.text)))
  }
  return { ...root, children }
}

/** `# `, `- `, `[] `… at the start of a plain text block turn it into that kind. */
export function applyShortcut(block: TextBlock): TextBlock | null {
  if (block.kind !== 'text') return null
  for (const [prefix, kind] of SHORTCUTS) {
    if (kind === 'divider' ? block.text === prefix : block.text.startsWith(prefix)) {
      return {
        ...turnInto(block, kind),
        text: kind === 'divider' ? '' : block.text.slice(prefix.length),
      }
    }
  }
  return null
}

export function kindMatches(query: string): KindOption[] {
  const needle = query.trim().toLowerCase()
  return KIND_OPTIONS.filter((option) => option.label.toLowerCase().includes(needle))
}

/** Each numbered item's number: a run of numbered blocks counts from 1. */
export function numberedPositions(blocks: Block[]): number[] {
  let run = 0
  return blocks.map((block) => {
    run = block.kind === 'number' ? run + 1 : 0
    return run
  })
}

/** The page's own paper — theme, feel, accent — so typing looks like the page it becomes. */
export function frameOf(
  root: WsxElement,
): Pick<ComponentProps<typeof SheetFrame>, 'theme' | 'feel' | 'accent'> {
  const pick = (value: WsxValue | undefined) => (typeof value === 'string' ? value : undefined)
  return {
    theme: pick(root.props.theme),
    feel: pick(root.props.feel),
    accent: pick(root.props.accent),
  } as Pick<ComponentProps<typeof SheetFrame>, 'theme' | 'feel' | 'accent'>
}
