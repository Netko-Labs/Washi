import type { WsxNode } from './types'

/** Whether a page runs: code above its markup, or a `{…}` hole or code-valued prop in it. */
export function hasCode(node: WsxNode): boolean {
  if (node.kind === 'code') return true
  if (node.kind === 'text') return false
  return Boolean(node.prelude || node.code) || node.children.some(hasCode)
}
