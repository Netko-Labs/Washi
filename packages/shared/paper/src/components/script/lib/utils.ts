import { validate, type WsxElement, type WsxNode, type WsxValue } from '@washi/wsx'
import { paperRegistry } from '../../../registry/specs'

/** The verb a script's handler becomes; it never leaves the browser. */
export const INVOKE = 'script.invoke'

const PRESS = new Set(['onPress', 'onClick'])

function propsOf(raw: unknown): Record<string, WsxValue> {
  const out: Record<string, WsxValue> = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value && typeof value === 'object' && 'washiHandler' in value) {
      const { washiHandler } = value as { washiHandler: number }
      if (PRESS.has(key)) out.action = { verb: INVOKE, handler: Number(washiHandler) }
      continue
    }
    out[key] = value as WsxValue
  }
  return out
}

/** What `view()` returned, as WSX: elements, text, fragments flattened, handlers as actions. */
export function toNodes(value: unknown): WsxNode[] {
  if (value === null || value === undefined || typeof value === 'boolean') return []
  if (typeof value === 'string' || typeof value === 'number')
    return [{ kind: 'text', value: String(value) }]
  if (Array.isArray(value)) return value.flatMap(toNodes)
  if (typeof value !== 'object') return []
  const { name, props, children } = value as { name?: unknown; props?: unknown; children?: unknown }
  const kids = Array.isArray(children) ? children.flatMap(toNodes) : []
  if (name === '__fragment') return kids
  if (typeof name !== 'string') return []
  return [{ kind: 'element', name, props: propsOf(props), children: kids }]
}

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

/** Page state holds text, numbers, true or false; a script setting anything else is told so. */
export function stateValue(json: string): string | number | boolean | null {
  const value: unknown = JSON.parse(json)
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
    return value as string | number | boolean | null
  }
  throw new Error('page state holds text, numbers or true/false')
}
