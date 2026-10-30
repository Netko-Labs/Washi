import type { WsxElement, WsxNode } from '@washi/wsx'
import { tableOf, walk } from './share'

const TABLE_KEYS: readonly string[] = ['bind', 'history', 'table']

const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function mentions(value: unknown, test: (text: string) => boolean): boolean {
  if (typeof value === 'string') return test(value)
  if (Array.isArray(value)) return value.some((each) => mentions(each, test))
  if (value && typeof value === 'object') {
    return Object.values(value).some((each) => mentions(each, test))
  }
  return false
}

/** A bind's own `table` names the table, never a column. */
function scanned(key: string, value: unknown): unknown {
  if (!TABLE_KEYS.includes(key)) return value
  if (typeof value === 'string') return null
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  return Object.fromEntries(Object.entries(value).filter(([field]) => field !== 'table'))
}

function rowRefsIn(node: WsxNode, rowRef: RegExp): boolean {
  if (node.kind === 'text') return rowRef.test(node.value)
  if (node.kind !== 'element') return false
  return (
    mentions(node.props, (text) => rowRef.test(text)) ||
    node.children.some((child) => rowRefsIn(child, rowRef))
  )
}

/**
 * Whether an element over `table` names `column` in its literal props — a view's `groupBy`, a
 * `bind`'s where or orderBy, a Board's `title` — or `$row.<column>` anywhere under it. Page code
 * is not read.
 */
export function namesColumn(root: WsxElement, table: string, column: string): boolean {
  const rowRef = new RegExp(`\\$row\\.${escaped(column)}(?![\\w$])`)
  const named = (text: string) => text === column || rowRef.test(text)
  let found = false
  walk(root, (node) => {
    if (found || !TABLE_KEYS.some((key) => tableOf(node.props[key]) === table)) return
    found =
      Object.entries(node.props).some(([key, value]) => mentions(scanned(key, value), named)) ||
      node.children.some((child) => rowRefsIn(child, rowRef))
  })
  return found
}
