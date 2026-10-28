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
    if (node.kind !== 'element') return
    // A Ref, a PageLink and an Include all point at the page they name.
    if (
      (node.name === 'Ref' || node.name === 'PageLink' || node.name === 'Include') &&
      typeof node.props.sheet === 'string'
    ) {
      refs.add(node.props.sheet)
    }
    // A canvas node that opens a page links to it as surely as a Ref does.
    if (node.name === 'Node' && typeof node.props.page === 'string') refs.add(node.props.page)
  })
  return [...refs]
}

const FILE_KEY = /^file:[a-z0-9-]{1,48}$/

/** Every upload the page uses, by key — a cover, an icon, a file, a video, a picture in a gallery. */
export function extractFiles(root: WsxElement): string[] {
  const files = new Set<string>()
  walk(root, (node) => {
    if (node.kind !== 'element') return
    for (const value of Object.values(node.props)) {
      if (typeof value === 'string' && FILE_KEY.test(value)) files.add(value)
    }
  })
  return [...files]
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
