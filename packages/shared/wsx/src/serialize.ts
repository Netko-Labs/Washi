import type { WsxElement, WsxNode, WsxValue } from './types'

function serializeValue(value: WsxValue): string {
  return JSON.stringify(value)
}

function serializeProps({ props, code = {} }: WsxElement): string {
  const literal = Object.entries(props).map(([key, value]) => {
    if (value === true) return ` ${key}`
    if (typeof value === 'string') return ` ${key}=${JSON.stringify(value)}`
    return ` ${key}={${serializeValue(value)}}`
  })
  const written = Object.entries(code).map(([key, source]) => ` ${key}={${source}}`)
  return [...literal, ...written].join('')
}

/** JSX text collapses whitespace and reads `<{}>&` as markup, so such text goes in as a string. */
function serializeText(value: string): string {
  const isPlain = /^[^\s<>{}&]([^\n<>{}&]*[^\s<>{}&])?$/.test(value) && !/\s{2}/.test(value)
  if (isPlain) return value
  // Lines read as lines: a backtick string, whenever nothing in it would need escaping there.
  const isLines = value.includes('\n') && !/[`\\]|\$\{/.test(value)
  return isLines ? `{\`${value}\`}` : `{${JSON.stringify(value)}}`
}

function serializeNode(node: WsxNode, depth: number): string {
  const indent = '  '.repeat(depth)
  if (node.kind === 'text') return `${indent}${serializeText(node.value)}`
  if (node.kind === 'code') return `${indent}{${node.source}}`

  const open = `${node.name}${serializeProps(node)}`
  if (node.children.length === 0) return `${indent}<${open} />`

  const single = node.children.length === 1 && node.children[0]?.kind === 'text'
  if (single && node.children[0]?.kind === 'text') {
    return `${indent}<${open}>${serializeText(node.children[0].value)}</${node.name}>`
  }

  const body = node.children.map((child) => serializeNode(child, depth + 1)).join('\n')
  return `${indent}<${open}>\n${body}\n${indent}</${node.name}>`
}

/** Canonical WSX text for a tree, a page's code above its markup. parse(serialize(tree)) round-trips. */
export function serialize(root: WsxNode): string {
  const prelude = root.kind === 'element' && root.prelude ? `${root.prelude.source}\n\n` : ''
  return `${prelude}${serializeNode(root, 0)}\n`
}
