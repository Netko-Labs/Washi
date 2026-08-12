import type { WsxElement, WsxNode } from './types'

function walk(node: WsxNode, visit: (node: WsxNode) => void) {
  visit(node)
  if (node.kind === 'element') {
    for (const child of node.children) walk(child, visit)
  }
}

/** Plain text of a sheet, for search indexing. */
export function extractText(root: WsxElement): string {
  const parts: string[] = []
  const title = root.props.title
  if (typeof title === 'string') parts.push(title)
  walk(root, (node) => {
    if (node.kind === 'text') parts.push(node.value)
  })
  return parts.join(' ')
}

/** Sheet ids referenced via <Ref sheet="…">, for the link graph. */
export function extractRefs(root: WsxElement): string[] {
  const refs = new Set<string>()
  walk(root, (node) => {
    if (node.kind === 'element' && node.name === 'Ref' && typeof node.props.sheet === 'string') {
      refs.add(node.props.sheet)
    }
  })
  return [...refs]
}
