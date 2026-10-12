import type { WsxElement, WsxMissing, WsxNode } from './types'

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

/** Capabilities a sheet asked for that the registry lacks — each is a registry request. */
export function extractMissing(root: WsxElement): WsxMissing[] {
  const out: WsxMissing[] = []
  const descend = (node: WsxNode, path: string) => {
    if (node.kind !== 'element') return
    const nodePath = path ? `${path} > ${node.name}` : node.name
    if (node.name === 'Missing') {
      out.push({
        kind: String(node.props.kind ?? ''),
        reason: String(node.props.reason ?? ''),
        path: nodePath,
      })
    }
    for (const child of node.children) descend(child, nodePath)
  }
  descend(root, '')
  return out
}
