import { validate, type WsxElement, type WsxNode } from '@washi/wsx'
import { toNodes } from '../../../lib/sandbox'
import { paperRegistry } from '../../../registry/specs'

const holds = (nodes: WsxNode[], name: string): boolean =>
  nodes.some(
    (node) => node.kind === 'element' && (node.name === name || holds(node.children, name)),
  )

/**
 * What `view()` drew, checked as any page is. The `<Sheet>` keeps the page's own literal props —
 * its look and who reads it are never the code's to change.
 */
export function checkDrawn(
  value: unknown,
  page: WsxElement,
): { root: WsxElement } | { reason: string } {
  const [sheet, ...rest] = toNodes(value)
  if (sheet?.kind !== 'element' || sheet.name !== 'Sheet' || rest.length > 0) {
    return { reason: 'view() must draw one <Sheet>' }
  }
  if (holds(sheet.children, 'Script')) return { reason: 'a page that runs draws no <Script>' }
  const root: WsxElement = {
    kind: 'element',
    name: 'Sheet',
    props: page.props,
    children: sheet.children,
  }
  const errors = validate(root, paperRegistry).filter((each) => each.severity === 'error')
  if (errors.length === 0) return { root }
  return {
    reason: errors
      .slice(0, 2)
      .map((each) => each.message)
      .join('; '),
  }
}

/** The page as written, minus everything code fills: what draws before it runs, or where it can't. */
export function literalOnly(node: WsxElement): WsxElement {
  const children = node.children.flatMap((child): WsxNode[] => {
    if (child.kind === 'code') return []
    if (child.kind === 'text') return [child]
    if (child.code || !(child.name in paperRegistry.components)) return []
    return [literalOnly(child)]
  })
  return { kind: 'element', name: node.name, props: node.props, children }
}
