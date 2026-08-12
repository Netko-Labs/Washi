import type { WsxNode, WsxValue } from './types'

function serializeValue(value: WsxValue): string {
  return JSON.stringify(value)
}

function serializeProps(props: Record<string, WsxValue>): string {
  return Object.entries(props)
    .map(([key, value]) => {
      if (value === true) return ` ${key}`
      if (typeof value === 'string') return ` ${key}=${JSON.stringify(value)}`
      return ` ${key}={${serializeValue(value)}}`
    })
    .join('')
}

function serializeNode(node: WsxNode, depth: number): string {
  const indent = '  '.repeat(depth)
  if (node.kind === 'text') return `${indent}${node.value}`

  const open = `${node.name}${serializeProps(node.props)}`
  if (node.children.length === 0) return `${indent}<${open} />`

  const single = node.children.length === 1 && node.children[0]?.kind === 'text'
  if (single && node.children[0]?.kind === 'text') {
    return `${indent}<${open}>${node.children[0].value}</${node.name}>`
  }

  const body = node.children.map((child) => serializeNode(child, depth + 1)).join('\n')
  return `${indent}<${open}>\n${body}\n${indent}</${node.name}>`
}

/** Canonical WSX text for a tree. parse(serialize(tree)) round-trips. */
export function serialize(root: WsxNode): string {
  return `${serializeNode(root, 0)}\n`
}
