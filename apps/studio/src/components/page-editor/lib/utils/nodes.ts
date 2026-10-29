import type { WsxElement, WsxNode, WsxValue } from '@washi/wsx'
import { element } from '../convert'
import type { BookmarkPreview, DataPick } from '../types'
import { STARTER_AUTOMATION, STARTER_FORMULA, STARTER_WIDGET } from '../values'

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
  if (pick.kind === 'formula') {
    return element('Formula', { name: 'with_tax' }, [{ kind: 'text', value: STARTER_FORMULA }])
  }
  if (pick.kind === 'widget') {
    return element('Widget', { title: 'A clock' }, [{ kind: 'text', value: STARTER_WIDGET }])
  }
  if (pick.kind === 'upload' || pick.kind === 'gallery') {
    throw new Error('an upload lands once its file is stored')
  }
  if (pick.kind === 'code') throw new Error('page code is written in the source, above the page')
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
