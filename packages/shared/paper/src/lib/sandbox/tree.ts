import type { WsxNode, WsxValue } from '@washi/wsx'
import type { DrawnHandler, DrawnNode } from '../types'
import { INVOKE, PRESS_PROPS } from './values'

function propsOf(raw: unknown): Record<string, WsxValue> {
  const out: Record<string, WsxValue> = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (key === 'key') continue
    if (value && typeof value === 'object' && 'washiHandler' in value) {
      const { washiHandler } = value as DrawnHandler
      if (PRESS_PROPS.has(key)) out.action = { verb: INVOKE, handler: Number(washiHandler) }
      continue
    }
    out[key] = value as WsxValue
  }
  return out
}

/** `Hello {name}` arrives as two runs; drawn as one, as a page written by hand would hold it. */
function joinText(nodes: WsxNode[]): WsxNode[] {
  const out: WsxNode[] = []
  for (const node of nodes) {
    const last = out.at(-1)
    if (node.kind === 'text' && last?.kind === 'text') {
      out[out.length - 1] = { kind: 'text', value: last.value + node.value }
    } else out.push(node)
  }
  return out
}

/** What a sandbox drew, as WSX: elements, text, fragments flattened, handlers as actions. */
export function toNodes(value: unknown): WsxNode[] {
  if (value === null || value === undefined || typeof value === 'boolean') return []
  if (typeof value === 'string' || typeof value === 'number')
    return [{ kind: 'text', value: String(value) }]
  if (Array.isArray(value)) return value.flatMap(toNodes)
  if (typeof value !== 'object') return []
  const { name, props, children } = value as DrawnNode
  const kids = Array.isArray(children) ? joinText(children.flatMap(toNodes)) : []
  if (name === '__fragment') return kids
  if (typeof name !== 'string') return []
  return [{ kind: 'element', name, props: propsOf(props), children: kids }]
}

/** Page state holds text, numbers, true or false; code setting anything else is told so. */
export function stateValue(json: string): string | number | boolean | null {
  const value: unknown = JSON.parse(json)
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
    return value as string | number | boolean | null
  }
  throw new Error('page state holds text, numbers or true/false')
}
