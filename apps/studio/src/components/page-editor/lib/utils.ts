import { parse, serialize, type WsxElement, type WsxNode, type WsxValue } from '@washi/wsx'
import type {
  Block,
  DataPick,
  KindOption,
  PageRef,
  SlashOption,
  TableRef,
  TextBlock,
  TextKind,
} from './types'
import { HEADING_LEVELS, KIND_OPTIONS, LINK_MATCHES, LIST_MARKERS, SHORTCUTS } from './values'

function element(name: string, props: Record<string, WsxValue>, children: WsxNode[]): WsxElement {
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
  return only.name === 'Text' ? plainText(only) : null
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

/** `/database Bugs` names the new table `bugs`; a bare `/database` takes the next free name. */
function newDatabaseName(query: string, taken: string[]): string {
  const typed = query
    .replace(/^\s*(new\s+)?database\s*/i, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  const base = /^[a-z]/.test(typed) ? typed.slice(0, 48) : 'database'
  if (!taken.includes(base)) return base
  let n = 2
  while (taken.includes(`${base}_${n}`)) n++
  return `${base}_${n}`
}

/** Text kinds first, then what can live on the page: a new database, a view, a progress chart. */
function pageOptions(needle: string, pages: PageRef[]): Extract<SlashOption, { type: 'data' }>[] {
  const subpages = [
    { key: 'subpage', label: 'New page inside', hint: 'page', pick: { kind: 'subpage' as const } },
    {
      key: 'subpages',
      label: 'Subpages',
      hint: 'live list',
      pick: { kind: 'subpages' as const, layout: 'list' as const },
    },
    {
      key: 'subpage-gallery',
      label: 'Subpage gallery',
      hint: 'covers',
      pick: { kind: 'subpages' as const, layout: 'gallery' as const },
    },
  ].map((option) => ({ type: 'data' as const, ...option }))
  const term = needle.replace(/^(link( to)?( page)?)\s*/, '')
  const links = term
    ? pages
        .filter((page) => page.title.toLowerCase().includes(term))
        .slice(0, LINK_MATCHES)
        .map((page) => ({
          type: 'data' as const,
          key: `link:${page.id}`,
          label: `Link to page · ${page.title || 'Untitled'}`,
          hint: 'link',
          pick: { kind: 'link' as const, sheet: page.id },
        }))
    : []
  const shown = subpages.filter(
    (option) => option.label.toLowerCase().includes(needle) || /^(sub)?pages?/.test(needle),
  )
  return [...shown, ...links]
}

export function slashMatches(
  query: string,
  tables: TableRef[],
  pages: PageRef[] = [],
): SlashOption[] {
  const needle = query.trim().toLowerCase()
  const kinds = kindMatches(query).map((option) => ({ type: 'text' as const, ...option }))
  const name = newDatabaseName(
    query,
    tables.map((table) => table.name),
  )
  const data: Extract<SlashOption, { type: 'data' }>[] = [
    {
      type: 'data',
      key: 'database',
      label: 'New database',
      hint: name,
      pick: { kind: 'database', name },
    },
    ...tables.flatMap((table): Extract<SlashOption, { type: 'data' }>[] => [
      {
        type: 'data',
        key: `view:${table.name}`,
        label: `Linked view · ${table.name.replace(/_/g, ' ')}`,
        hint: 'live',
        pick: { kind: 'view', table: table.name },
      },
      ...(table.done
        ? [
            {
              type: 'data' as const,
              key: `progress:${table.name}`,
              label: `Progress · ${table.name.replace(/_/g, ' ')}`,
              hint: '30 days',
              pick: { kind: 'progress' as const, table },
            },
          ]
        : []),
    ]),
  ]
  const matching = data.filter(
    (option) =>
      option.label.toLowerCase().includes(needle) ||
      (option.key === 'database' && /^(new\s+)?database/.test(needle)),
  )
  return [...kinds, ...pageOptions(needle, pages), ...matching]
}

/** The live block a pick becomes, as WSX the page keeps whole. */
export function dataNode(pick: DataPick): WsxElement {
  if (pick.kind === 'link') return element('PageLink', { sheet: pick.sheet }, [])
  if (pick.kind === 'subpages') {
    return element('Subpages', pick.layout === 'list' ? {} : { layout: pick.layout }, [])
  }
  if (pick.kind === 'progress' && pick.table.done) {
    const { column, values } = pick.table.done
    return element(
      'Chart',
      {
        kind: 'area',
        history: {
          table: pick.table.name,
          where: [{ column, op: 'in', value: values }],
          range: '30d',
        },
      },
      [],
    )
  }
  const table =
    pick.kind === 'progress'
      ? pick.table.name
      : pick.kind === 'view'
        ? pick.table
        : pick.kind === 'database'
          ? pick.name
          : ''
  return element('Database', { table }, [])
}

/**
 * The `<Sheet>` a locked block is drawn in: the page's theme and feel, never its look — the cover
 * and icon belong to the page once, not to every block (D64).
 */
export function blockFrame(rootProps: Record<string, WsxValue>): Record<string, WsxValue> {
  const { cover: _cover, icon: _icon, ...frame } = rootProps
  return frame
}

export function lockedBlock(node: WsxElement): Block {
  return locked(node)
}

/** Each numbered item's number: a run of numbered blocks counts from 1. */
export function numberedPositions(blocks: Block[]): number[] {
  let run = 0
  return blocks.map((block) => {
    run = block.kind === 'number' ? run + 1 : 0
    return run
  })
}

export function swapNode(node: WsxNode, from: WsxElement, to: WsxElement): WsxNode {
  if (node === from) return to
  if (node.kind !== 'element') return node
  // Untouched elements keep their identity: the next swap still finds its block by reference.
  const children = node.children.map((child) => swapNode(child, from, to))
  return children.every((child, index) => child === node.children[index])
    ? node
    : { ...node, children }
}

/** Row by row, a block of the same kind keeps its id, so the field being typed in stays mounted. */
export function reconcile(current: Block[], next: Block[]): Block[] {
  const merged = next.map((block, index) => {
    const old = current[index]
    return old && old.kind === block.kind ? { ...block, id: old.id } : block
  })
  return merged.length > 0 ? merged : [newBlock()]
}

/**
 * The page is named by its heading, as in Notion: a first block that is a level-1 heading with
 * text. A row page is named by its row instead, so it never takes one.
 */
export function titleOf(blocks: Block[], sheet: { rowOf: string | null }): string | null {
  const first = blocks[0]
  if (sheet.rowOf || !first || first.kind !== 'h1') return null
  const text = first.text.trim()
  return text ? text.slice(0, 200) : null
}

/**
 * The blocks as the page they make, wearing the `<Sheet>` of the version they were typed on — so a
 * save never writes back a cover, icon or feel someone changed since (D64); the merge keeps theirs.
 */
export function sourceOver(savedSource: string, blocks: Block[]): string {
  return serialize(toSheet(parse(savedSource), blocks))
}
