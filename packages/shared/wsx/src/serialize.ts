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

/**
 * Text and code side by side stay on one line, as written: a line break between them would drop
 * the space in `Hello {name}`. Text there is raw unless an edge away from code would be trimmed.
 */
function serializeInline(children: WsxNode[]): string {
  return children
    .map((child, at) => {
      if (child.kind === 'code') return `{${child.source}}`
      if (child.kind !== 'text') return ''
      const value = child.value
      const isRaw =
        /^[^<>{}&\n]*$/.test(value) &&
        !/\s{2}/.test(value) &&
        (children[at - 1]?.kind === 'code' || !/^\s/.test(value)) &&
        (children[at + 1]?.kind === 'code' || !/\s$/.test(value))
      return isRaw ? value : `{${JSON.stringify(value)}}`
    })
    .join('')
}

function serializeNode(node: WsxNode, depth: number): string {
  const indent = '  '.repeat(depth)
  if (node.kind === 'text') return `${indent}${serializeText(node.value)}`
  if (node.kind === 'code') return `${indent}{${node.source}}`

  const open = `${node.name}${serializeProps(node)}`
  if (node.children.length === 0) return `${indent}<${open} />`

  const isMixed =
    node.children.some((child) => child.kind === 'code') &&
    node.children.every((child) => child.kind !== 'element')
  if (isMixed) return `${indent}<${open}>${serializeInline(node.children)}</${node.name}>`

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
