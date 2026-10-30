import type { DataOption, PageRef, SlashEntry, SlashOption, TableRef } from '../types'
import {
  LINK_MATCHES,
  SLASH_BLOCKS,
  SLASH_STEP_ORDER,
  SLASH_STEPS,
  STARTER_OPTIONS,
  UPLOAD_OPTIONS,
} from '../values'

const finds = (needle: string, label: string, words: string) =>
  !needle || label.toLowerCase().includes(needle) || words.includes(needle)

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

export function databaseOptions(query: string, tables: TableRef[]): DataOption[] {
  const needle = query.trim().toLowerCase()
  if (needle && !'new database table'.includes(needle) && !/^(new\s+)?database/.test(needle)) {
    return []
  }
  const name = newDatabaseName(
    query,
    tables.map((table) => table.name),
  )
  return [
    {
      type: 'data',
      group: 'database',
      key: 'database',
      label: 'New database',
      hint: name,
      pick: { kind: 'database', name },
    },
  ]
}

/**
 * `/embed …`, `/bookmark …`, or an https address typed after `/`: that site in a frame, or as a card.
 * The word typed first leads; a bare address offers the frame first.
 */
export function linkOptions(query: string): DataOption[] {
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
        group: 'media',
        key: asked,
        label: asked === 'embed' ? 'Embed' : 'Bookmark',
        hint: 'paste an https address',
        pick: asked === 'embed' ? { kind: 'embed', src: '' } : { kind: 'bookmark', href: '' },
      },
    ]
  }
  const embed: DataOption = {
    type: 'data',
    group: 'media',
    key: `embed:${url.href}`,
    label: `Embed · ${url.hostname}`,
    hint: 'Show the site',
    pick: { kind: 'embed', src: url.href },
  }
  const bookmark: DataOption = {
    type: 'data',
    group: 'media',
    key: `bookmark:${url.href}`,
    label: `Bookmark · ${url.hostname}`,
    hint: 'A link as a card',
    pick: { kind: 'bookmark', href: url.href },
  }
  return asked === 'bookmark' ? [bookmark, embed] : [embed, bookmark]
}

/** Image, Video, Audio, File: each opens the picker and lands as its block once uploaded. */
export function uploadOptions(needle: string): DataOption[] {
  return UPLOAD_OPTIONS.filter((option) => finds(needle, option.label, option.words)).map(
    (option) => ({
      type: 'data',
      group: 'media',
      key: `upload:${option.as}`,
      label: option.label,
      hint: 'Upload',
      pick: { kind: 'upload', as: option.as },
    }),
  )
}

/** Steps, Compare, FAQ, Bento, Countdown: a block with words to type over. */
export function starterOptions(needle: string): DataOption[] {
  return STARTER_OPTIONS.filter((option) => finds(needle, option.label, option.words)).map(
    (option) => ({
      type: 'data',
      group: option.group,
      key: `starter:${option.block}`,
      label: option.label,
      hint: option.hint,
      pick: { kind: 'starter', block: option.block },
    }),
  )
}

/** Columns and tabs sit on the page itself: never offered inside a column or a tab. */
export function blockOptions(needle: string, isNested: boolean): SlashOption[] {
  const steps = SLASH_STEP_ORDER.map(
    (step): SlashEntry => ({
      type: 'step',
      group: SLASH_STEPS[step].group,
      key: `step:${step}`,
      label: `${SLASH_STEPS[step].label}…`,
      hint: SLASH_STEPS[step].hint,
      words: SLASH_STEPS[step].words,
      step,
    }),
  )
  return [...SLASH_BLOCKS, ...steps].filter(
    (entry) => !(isNested && entry.isTopLevel) && finds(needle, entry.label, entry.words),
  )
}

/** A page found by its title as it is typed: `/budget` or `/link budget`. Listed after every block. */
export function pageLinks(needle: string, pages: PageRef[]): DataOption[] {
  const term = needle.replace(/^(link( to)?( page)?)\s*/, '')
  if (!term) return []
  return pages
    .filter((page) => page.title.toLowerCase().includes(term))
    .slice(0, LINK_MATCHES)
    .map((page) => ({
      type: 'data',
      group: 'pages',
      key: `link:${page.id}`,
      label: `Link to page · ${page.title || 'Untitled'}`,
      hint: 'Link',
      pick: { kind: 'link', sheet: page.id },
    }))
}
