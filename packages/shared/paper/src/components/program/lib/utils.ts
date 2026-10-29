import { validate, type WsxElement, type WsxNode } from '@washi/wsx'
import { toNodes } from '../../../lib/sandbox'
import { paperRegistry } from '../../../registry/specs'

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
  const root: WsxElement = {
    kind: 'element',
    name: 'Sheet',
    props: page.props,
    children: sheet.children,
  }
  const errors = validate(root, paperRegistry).filter((each) => each.severity === 'error')
  if (errors.length === 0) return { root }
  // Which primitive, once each: two Chips with the same wrong prop are one thing to fix.
  const said = errors.map(
    (each) => `<${each.path?.split(' > ').at(-1) ?? 'Sheet'}> ${each.message}`,
  )
  return { reason: [...new Set(said)].slice(0, 3).join('; ') }
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

/** Why the code stopped, said once at the top of the page in its own look — a quiet callout. */
export function withNotice(root: WsxElement, reason: string): WsxElement {
  const notice: WsxElement = {
    kind: 'element',
    name: 'Callout',
    props: { tone: 'warning', title: 'This page’s code isn’t running' },
    children: [{ kind: 'text', value: reason }],
  }
  return { ...root, children: [notice, ...root.children] }
}
