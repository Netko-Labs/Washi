import { parse, serialize, type WsxElement, type WsxNode, type WsxValue } from '@washi/wsx'
import type {
  Block,
  ColumnSlot,
  ColumnsBlock,
  TabSlot,
  TabsBlock,
  TextBlock,
  TextKind,
} from './types'
import { HEADING_LEVELS, LIST_MARKERS } from './values'

export function element(
  name: string,
  props: Record<string, WsxValue>,
  children: WsxNode[],
): WsxElement {
  return { kind: 'element', name, props, children }
}

function text(value: string): WsxNode[] {
  return value ? [{ kind: 'text', value }] : []
}

/**
 * A block's text when it is one run of text (or one plain `<Text>`); null when it holds more.
 * Several runs stay locked: the parser trims each, so no join would give the page's own spacing.
 */
function plainText(node: WsxElement): string | null {
  const [only, ...rest] = node.children
  if (!only) return ''
  if (rest.length > 0) return null
  if (only.kind === 'text') return only.value
  if (only.kind === 'code') return null
  return only.name === 'Text' ? plainText(only) : null
}

export function newBlock(kind: TextKind = 'text', value = ''): TextBlock {
  return { id: crypto.randomUUID(), kind, text: value, props: {} }
}

export function turnInto(block: TextBlock, kind: TextKind): TextBlock {
  return { id: block.id, kind, text: kind === 'divider' ? '' : block.text, props: {} }
}

export function lockedBlock(node: WsxElement): Block {
  return { id: crypto.randomUUID(), kind: 'locked', node }
}

function fromList(node: WsxElement): Block[] {
  const marker = node.props.marker
  const kind: TextKind = marker === 'number' ? 'number' : marker === 'check' ? 'todo' : 'bullet'
  const items = node.children.map((item) =>
    item.kind === 'element' && item.name === 'Item' ? { item, value: plainText(item) } : null,
  )
  if (items.some((entry) => entry === null || entry.value === null)) return [lockedBlock(node)]
  return items.map((entry) => {
    const { done, ...props } = entry?.item.props ?? {}
    return { ...newBlock(kind, entry?.value ?? ''), done: done === true, props }
  })
}

/** `<Columns>` of `<Column>`s edits in place: each column is its own run of blocks. */
function fromColumns(node: WsxElement): Block[] {
  const columns = node.children.filter(
    (child): child is WsxElement => child.kind === 'element' && child.name === 'Column',
  )
  if (columns.length !== node.children.length || columns.length < 2) return [lockedBlock(node)]
  const slots = columns.map(({ props: { ratio, ...props }, children }): ColumnSlot => {
    const blocks = fromNodes(children)
    return {
      id: crypto.randomUUID(),
      ratio: typeof ratio === 'number' ? ratio : 1,
      props,
      blocks: blocks.length > 0 ? blocks : [newBlock()],
    }
  })
  return [{ id: crypto.randomUUID(), kind: 'columns', props: node.props, columns: slots }]
}

/** `<Tabs>` edits in place when it has a label per `<Tab>`; each tab is its own run of blocks. */
function fromTabs(node: WsxElement): Block[] {
  const tabs = node.children.filter(
    (child): child is WsxElement => child.kind === 'element' && child.name === 'Tab',
  )
  const { labels } = node.props
  const names =
    Array.isArray(labels) && labels.every((label) => typeof label === 'string') ? labels : []
  const isWhole = tabs.length === node.children.length && names.length === tabs.length
  if (!isWhole || tabs.length < 2) return [lockedBlock(node)]
  const slots = tabs.map(({ props, children }, at): TabSlot => {
    const blocks = fromNodes(children)
    return {
      id: crypto.randomUUID(),
      label: String(names[at]),
      props,
      blocks: blocks.length > 0 ? blocks : [newBlock()],
    }
  })
  return [{ id: crypto.randomUUID(), kind: 'tabs', props: node.props, tabs: slots }]
}

function fromElement(node: WsxElement, isNested: boolean): Block[] {
  if (node.name === 'List') return fromList(node)
  // Columns and tabs never nest: one inside a column or a tab stays whole.
  if (node.name === 'Columns' && !isNested) return fromColumns(node)
  if (node.name === 'Tabs' && !isNested) return fromTabs(node)
  if (node.name === 'Divider') return [{ ...newBlock('divider'), props: node.props }]
  if (node.name === 'Code') {
    const value = node.children.map((child) => (child.kind === 'text' ? child.value : '')).join('')
    return [{ ...newBlock('code', value), props: node.props }]
  }
  const value = plainText(node)
  if (value === null) return [lockedBlock(node)]
  if (node.name === 'Title') {
    const { level, ...props } = node.props
    const kind: TextKind = level === 2 ? 'h2' : level === 3 ? 'h3' : 'h1'
    return [{ ...newBlock(kind, value), props }]
  }
  const kinds: Record<string, TextKind> = { Text: 'text', Quote: 'quote', Callout: 'callout' }
  const kind = kinds[node.name]
  return kind ? [{ ...newBlock(kind, value), props: node.props }] : [lockedBlock(node)]
}

/** Never handed code: a page that runs is edited as source (`PageBody`). */
function fromNodes(nodes: WsxNode[], isNested = true): Block[] {
  return nodes.flatMap((node) => {
    if (node.kind === 'code') return []
    return node.kind === 'text' ? [newBlock('text', node.value)] : fromElement(node, isNested)
  })
}

/** The sheet's top level as blocks: text a person can type into, anything else kept whole. */
export function toBlocks(root: WsxElement): Block[] {
  return fromNodes(root.children, false)
}

function toNode(block: TextBlock): WsxElement | null {
  if (block.kind === 'divider') return element('Divider', block.props, [])
  if (block.kind === 'code') return element('Code', block.props, text(block.text.trimEnd()))
  if (!block.text.trim()) return null
  const level = HEADING_LEVELS[block.kind]
  if (level)
    return element('Title', level > 1 ? { ...block.props, level } : block.props, text(block.text))
  const names: Partial<Record<TextKind, string>> = {
    text: 'Text',
    quote: 'Quote',
    callout: 'Callout',
  }
  return element(names[block.kind] ?? 'Text', block.props, text(block.text))
}

function toColumns(block: ColumnsBlock): WsxElement {
  return element(
    'Columns',
    block.props,
    block.columns.map((column) =>
      element(
        'Column',
        column.ratio === 1 ? column.props : { ...column.props, ratio: column.ratio },
        toNodes(column.blocks),
      ),
    ),
  )
}

function toTabs(block: TabsBlock): WsxElement {
  return element(
    'Tabs',
    { ...block.props, labels: block.tabs.map((tab) => tab.label) },
    block.tabs.map((tab) => element('Tab', tab.props, toNodes(tab.blocks))),
  )
}

/** Neighbouring list items of one kind share a `<List>`; empty text is dropped. */
function toNodes(blocks: Block[]): WsxNode[] {
  const children: WsxNode[] = []
  let list: WsxElement | null = null
  for (const block of blocks) {
    if (block.kind === 'locked' || block.kind === 'columns' || block.kind === 'tabs') {
      list = null
      children.push(
        block.kind === 'locked'
          ? block.node
          : block.kind === 'columns'
            ? toColumns(block)
            : toTabs(block),
      )
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
  return children
}

/** Blocks back into the sheet. */
export function toSheet(root: WsxElement, blocks: Block[]): WsxElement {
  return { ...root, children: toNodes(blocks) }
}

/** Row by row, a block of the same kind keeps its id, so the field being typed in stays mounted. */
export function reconcile(current: Block[], next: Block[]): Block[] {
  const merged = next.map((block, index): Block => {
    const old = current[index]
    if (!old || old.kind !== block.kind) return block
    if (old.kind === 'tabs' && block.kind === 'tabs') {
      return {
        ...block,
        id: old.id,
        tabs: block.tabs.map((tab, at) => {
          const was = old.tabs[at]
          return was ? { ...tab, id: was.id, blocks: reconcile(was.blocks, tab.blocks) } : tab
        }),
      }
    }
    if (old.kind !== 'columns' || block.kind !== 'columns') return { ...block, id: old.id }
    return {
      ...block,
      id: old.id,
      columns: block.columns.map((column, at) => {
        const was = old.columns[at]
        return was
          ? { ...column, id: was.id, blocks: reconcile(was.blocks, column.blocks) }
          : column
      }),
    }
  })
  return merged.length > 0 ? merged : [newBlock()]
}

/**
 * The blocks as the page they make, wearing the `<Sheet>` of the version they were typed on — so a
 * save never writes back a cover, icon or feel someone changed since (D64); the merge keeps theirs.
 */
export function sourceOver(savedSource: string, blocks: Block[]): string {
  return serialize(toSheet(parse(savedSource), blocks))
}
