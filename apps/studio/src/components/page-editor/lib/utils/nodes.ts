import { unsplashCaption } from '@washi/paper/registry'
import { parse, type WsxElement, type WsxNode, type WsxValue } from '@washi/wsx'
import { element } from '../convert'
import type { BookmarkPreview, DataPick, StarterBlock } from '../types'
import {
  COUNTDOWN_DAYS,
  STARTER_AUTOMATION,
  STARTER_FORMULA,
  STARTER_SOURCES,
  STARTER_WIDGET_CODE,
} from '../values'

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

function dayKey(day: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`
}

export function starterNode(block: StarterBlock, today = new Date()): WsxElement {
  if (block === 'countdown') {
    const soon = new Date(today.getFullYear(), today.getMonth(), today.getDate() + COUNTDOWN_DAYS)
    return element('Countdown', { to: dayKey(soon), label: 'Until the deadline' }, [])
  }
  const [node] = parse(`<Sheet title="s">${STARTER_SOURCES[block]}</Sheet>`).children
  if (node?.kind !== 'element') throw new Error(`the ${block} starter is not a block`)
  return node
}

/** The page with the `/widget` clock's component above it: a widget draws the page's own code. */
export function withWidgetCode(source: string): string {
  return `${STARTER_WIDGET_CODE}\n\n${source}`
}

export function dataNode(pick: DataPick): WsxElement {
  if (pick.kind === 'starter') return starterNode(pick.block)
  if (pick.kind === 'automation') {
    return element('Automation', { table: pick.table, on: 'insert' }, [
      { kind: 'text', value: STARTER_AUTOMATION(pick.table) },
    ])
  }
  if (pick.kind === 'formula') {
    return element('Formula', { name: 'with_tax' }, [{ kind: 'text', value: STARTER_FORMULA }])
  }
  if (pick.kind === 'widget') {
    return element('Widget', { title: 'A clock' }, [element('Clock', {}, [])])
  }
  if (pick.kind === 'unsplash') {
    if (!pick.photo) throw new Error('a photo lands once it is picked')
    const caption = unsplashCaption(pick.photo.photographer)
    return element(
      'Figure',
      { src: pick.photo.regularUrl, alt: pick.photo.alt ?? caption, caption },
      [],
    )
  }
  if (pick.kind === 'upload' || pick.kind === 'gallery') {
    throw new Error('an upload lands once its file is stored')
  }
  if (pick.kind === 'code') throw new Error('page code is written in the source, above the page')
  if (pick.kind === 'tabs') throw new Error('tabs are edited in place, not kept whole')
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

export function swapNode(node: WsxNode, from: WsxElement, to: WsxElement): WsxNode {
  if (node === from) return to
  if (node.kind !== 'element') return node
  // Untouched elements keep their identity: the next swap still finds its block by reference.
  const children = node.children.map((child) => swapNode(child, from, to))
  return children.every((child, index) => child === node.children[index])
    ? node
    : { ...node, children }
}
