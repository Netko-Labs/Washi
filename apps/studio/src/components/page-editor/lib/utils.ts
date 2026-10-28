import type { UploadKind } from '@washi/domain'
import type { WsxElement, WsxNode, WsxValue } from '@washi/wsx'
import { element, turnInto } from './convert'
import type {
  Block,
  BookmarkPreview,
  DataPick,
  KindOption,
  PageRef,
  SlashOption,
  StoredUpload,
  TableRef,
  TextBlock,
} from './types'
import {
  KIND_OPTIONS,
  LINK_MATCHES,
  SHORTCUTS,
  STARTER_AUTOMATION,
  STARTER_FORMULA,
  STARTER_SCRIPT,
  STARTER_WIDGET,
  UPLOAD_OPTIONS,
} from './values'

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
/**
 * `/embed …`, `/bookmark …`, or an https address typed after `/`: that site in a frame, or as a card.
 * The word typed first leads; a bare address offers the frame first.
 */
function linkOptions(query: string): Extract<SlashOption, { type: 'data' }>[] {
  const asked = query
    .trim()
    .match(/^(embed|bookmark)\b\s*/i)?.[1]
    ?.toLowerCase()
  const typed = query.trim().replace(/^(embed|bookmark)\b\s*/i, '')
  let url: URL | null = null
  try {
    url = new URL(typed)
  } catch {
    url = null
  }
  if (url?.protocol !== 'https:') {
    if (!asked) return []
    return [
      {
        type: 'data',
        key: asked,
        label: asked === 'embed' ? 'Embed' : 'Bookmark',
        hint: 'paste an https address',
        pick: asked === 'embed' ? { kind: 'embed', src: '' } : { kind: 'bookmark', href: '' },
      },
    ]
  }
  const embed = {
    type: 'data' as const,
    key: `embed:${url.href}`,
    label: `Embed · ${url.hostname}`,
    hint: 'frame',
    pick: { kind: 'embed' as const, src: url.href },
  }
  const bookmark = {
    type: 'data' as const,
    key: `bookmark:${url.href}`,
    label: `Bookmark · ${url.hostname}`,
    hint: 'card',
    pick: { kind: 'bookmark' as const, href: url.href },
  }
  return asked === 'bookmark' ? [bookmark, embed] : [embed, bookmark]
}

/** Image, Video, Audio, File: each opens the picker and lands as its block once uploaded. */
function uploadOptions(needle: string): Extract<SlashOption, { type: 'data' }>[] {
  const gallery: Extract<SlashOption, { type: 'data' }> = {
    type: 'data',
    key: 'upload:gallery',
    label: 'Gallery',
    hint: 'pictures',
    pick: { kind: 'gallery' },
  }
  const uploads = UPLOAD_OPTIONS.filter(
    (option) =>
      !needle || option.label.toLowerCase().includes(needle) || option.words.includes(needle),
  ).map((option) => ({
    type: 'data' as const,
    key: `upload:${option.as}`,
    label: option.label,
    hint: 'upload',
    pick: { kind: 'upload' as const, as: option.as },
  }))
  const script: Extract<SlashOption, { type: 'data' }> = {
    type: 'data',
    key: 'script',
    label: 'Script',
    hint: 'TypeScript',
    pick: { kind: 'script' },
  }
  const pictures = !needle || 'gallery photos pictures album'.includes(needle) ? [gallery] : []
  const widget: Extract<SlashOption, { type: 'data' }> = {
    type: 'data',
    key: 'widget',
    label: 'Widget',
    hint: 'HTML',
    pick: { kind: 'widget' },
  }
  const code = !needle || 'script code typescript program'.includes(needle) ? [script] : []
  const html = !needle || 'widget html embed code'.includes(needle) ? [widget] : []
  const formula: Extract<SlashOption, { type: 'data' }> = {
    type: 'data',
    key: 'formula',
    label: 'Formula function',
    hint: 'TypeScript',
    pick: { kind: 'formula' },
  }
  const fn = !needle || 'formula function fn'.includes(needle) ? [formula] : []
  return [...uploads, ...pictures, ...code, ...html, ...fn]
}

/** The block an upload becomes: a picture, a player, or a document line. */
export function uploadNode(as: UploadKind, file: StoredUpload): WsxElement {
  const src = `file:${file.id}`
  if (as === 'image') return element('Figure', { src, alt: file.name }, [])
  if (as === 'video') return element('Video', { src, title: file.name }, [])
  if (as === 'audio') return element('Audio', { src, title: file.name }, [])
  return element('File', { src, name: file.name, bytes: file.size }, [])
}

/** A hidden picker, opened inside the press that chose it — browsers refuse one opened later. */
export function pickFiles(accept: string, isMany = false): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.multiple = isMany
    input.addEventListener('change', () => resolve([...(input.files ?? [])]), { once: true })
    input.addEventListener('cancel', () => resolve([]), { once: true })
    input.click()
  })
}

/** Pictures already stored, as a Gallery of Figures. */
export function galleryNode(files: StoredUpload[]): WsxElement {
  return element(
    'Gallery',
    {},
    files.map((file) => element('Figure', { src: `file:${file.id}`, alt: file.name }, [])),
  )
}

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
        key: `automation:${table.name}`,
        label: `Automation · ${table.name.replace(/_/g, ' ')}`,
        hint: 'server',
        pick: { kind: 'automation', table: table.name },
      },
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
  return [
    ...kinds,
    ...linkOptions(query),
    ...uploadOptions(needle),
    ...pageOptions(needle, pages),
    ...matching,
  ]
}

/** The live block a pick becomes, as WSX the page keeps whole. */
/** A bookmark carrying whatever the site said about itself; nothing it said is required. */
export function bookmarkNode(href: string, seen: BookmarkPreview | null): WsxElement {
  const props: Record<string, WsxValue> = { href }
  for (const key of ['title', 'description', 'image', 'site'] as const) {
    const value = seen?.[key]
    if (value) props[key] = value
  }
  return element('Bookmark', props, [])
}

export function dataNode(pick: DataPick): WsxElement {
  if (pick.kind === 'automation') {
    return element('Automation', { table: pick.table, on: 'insert' }, [
      { kind: 'text', value: STARTER_AUTOMATION(pick.table) },
    ])
  }
  if (pick.kind === 'script')
    return element('Script', {}, [{ kind: 'text', value: STARTER_SCRIPT }])
  if (pick.kind === 'formula') {
    return element('Formula', { name: 'with_tax' }, [{ kind: 'text', value: STARTER_FORMULA }])
  }
  if (pick.kind === 'widget') {
    return element('Widget', { title: 'A clock' }, [{ kind: 'text', value: STARTER_WIDGET }])
  }
  if (pick.kind === 'upload' || pick.kind === 'gallery') {
    throw new Error('an upload lands once its file is stored')
  }
  if (pick.kind === 'bookmark') return bookmarkNode(pick.href, null)
  if (pick.kind === 'embed') return element('Embed', { src: pick.src }, [])
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
