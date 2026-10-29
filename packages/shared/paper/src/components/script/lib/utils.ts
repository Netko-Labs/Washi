import { validate, type WsxElement, type WsxNode } from '@washi/wsx'
import { paperRegistry } from '../../../registry/specs'

const holds = (nodes: WsxNode[], name: string): boolean =>
  nodes.some(
    (node) => node.kind === 'element' && (node.name === name || holds(node.children, name)),
  )

/** The tree checked as a page would be — the same registry, the same budget; scripts never nest. */
export function checkTree(nodes: WsxNode[]): { root: WsxElement } | { reason: string } {
  if (holds(nodes, 'Script')) return { reason: 'a script cannot draw another script' }
  const root: WsxElement = {
    kind: 'element',
    name: 'Sheet',
    props: { title: 'Script' },
    children: nodes,
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
