import type { KindOption, PageRef, SlashOption, TableRef } from '../types'
import { KIND_OPTIONS, LINK_MATCHES, STARTER_OPTIONS, UPLOAD_OPTIONS } from '../values'

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
  const pageCode: Extract<SlashOption, { type: 'data' }> = {
    type: 'data',
    key: 'code',
    label: 'Page code',
    hint: 'TypeScript',
    pick: { kind: 'code' },
  }
  const pictures = !needle || 'gallery photos pictures album'.includes(needle) ? [gallery] : []
  const widget: Extract<SlashOption, { type: 'data' }> = {
    type: 'data',
    key: 'widget',
    label: 'Widget',
    hint: 'HTML',
    pick: { kind: 'widget' },
  }
  const code = !needle || 'code script typescript program hooks'.includes(needle) ? [pageCode] : []
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

/** Tab sections sit on the page itself: never offered inside a column or a tab. */
function layoutOptions(
  needle: string,
  isNested: boolean,
): Extract<SlashOption, { type: 'data' }>[] {
  if (isNested || (needle && !'tabs sections'.includes(needle))) return []
  return [{ type: 'data', key: 'tabs', label: 'Tabs', hint: 'sections', pick: { kind: 'tabs' } }]
}

/** Steps, Compare, FAQ, Countdown: a block with words to type over. */
function starterOptions(needle: string): Extract<SlashOption, { type: 'data' }>[] {
  return STARTER_OPTIONS.filter(
    (option) =>
      !needle || option.label.toLowerCase().includes(needle) || option.words.includes(needle),
  ).map((option) => ({
    type: 'data' as const,
    key: `starter:${option.block}`,
    label: option.label,
    hint: option.hint,
    pick: { kind: 'starter' as const, block: option.block },
  }))
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
  isNested = false,
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
    ...layoutOptions(needle, isNested),
    ...uploadOptions(needle),
    ...starterOptions(needle),
    ...pageOptions(needle, pages),
    ...matching,
  ]
}
