import type { WsxElement, WsxNode, WsxValue } from '@washi/wsx'
import type { Tone } from '../../../lib/types'
import { IDEA_STEP } from './constants'
import type { IdeaEdge, IdeaNode } from './types'

const TONES: Tone[] = ['neutral', 'accent', 'info', 'success', 'warning', 'danger']

const textOf = (node: WsxElement) =>
  node.children.map((child) => (child.kind === 'text' ? child.value : '')).join('')
const num = (value: WsxValue | undefined) => (typeof value === 'number' ? value : 0)
const str = (value: WsxValue | undefined) => (typeof value === 'string' && value ? value : null)

/** `<Node>`s and `<Edge>`s as React Flow sees them. */
export function fromWsx(canvas: WsxElement): { nodes: IdeaNode[]; edges: IdeaEdge[] } {
  const elements = canvas.children.filter((child): child is WsxElement => child.kind === 'element')
  const nodes = elements
    .filter((child) => child.name === 'Node')
    .map((child): IdeaNode => {
      const tone = str(child.props.tone)
      return {
        id: String(child.props.id),
        type: 'idea',
        position: { x: num(child.props.x), y: num(child.props.y) },
        data: {
          label: textOf(child),
          tone: TONES.includes(tone as Tone) ? (tone as Tone) : null,
          page: str(child.props.page),
        },
      }
    })
  const edges = elements
    .filter((child) => child.name === 'Edge')
    .map((child): IdeaEdge => {
      const label = str(child.props.label)
      return {
        id: `${child.props.from}->${child.props.to}`,
        source: String(child.props.from),
        target: String(child.props.to),
        ...(label && { label }),
      }
    })
  return { nodes, edges }
}

const element = (name: string, props: Record<string, WsxValue>, children: WsxNode[] = []) =>
  ({ kind: 'element', name, props, children }) as WsxElement

/** Back to markup a person can read and Washi can write: the canvas's own props survive. */
export function toWsx(canvas: WsxElement, nodes: IdeaNode[], edges: IdeaEdge[]): WsxElement {
  const ids = new Set(nodes.map((node) => node.id))
  return {
    ...canvas,
    children: [
      ...nodes.map((node) =>
        element(
          'Node',
          {
            id: node.id,
            x: Math.round(node.position.x),
            y: Math.round(node.position.y),
            ...(node.data.tone && { tone: node.data.tone }),
            ...(node.data.page && { page: node.data.page }),
          },
          [{ kind: 'text', value: node.data.label }],
        ),
      ),
      ...edges
        .filter((edge) => ids.has(edge.source) && ids.has(edge.target))
        .map((edge) =>
          element('Edge', {
            from: edge.source,
            to: edge.target,
            ...(typeof edge.label === 'string' && edge.label && { label: edge.label }),
          }),
        ),
    ],
  }
}

/** The next free `idea-n`, so a new node never takes an id an edge already names. */
export function nextId(nodes: IdeaNode[]): string {
  const taken = new Set(nodes.map((node) => node.id))
  let n = nodes.length + 1
  while (taken.has(`idea-${n}`)) n++
  return `idea-${n}`
}

/** `(x, y)`, stepped diagonally while an idea already sits there, so repeated adds stay visible. */
export function freeSpot(nodes: IdeaNode[], x: number, y: number): { x: number; y: number } {
  const isTaken = (at: { x: number; y: number }) =>
    nodes.some(
      (node) =>
        Math.abs(node.position.x - at.x) < IDEA_STEP / 2 &&
        Math.abs(node.position.y - at.y) < IDEA_STEP / 2,
    )
  const at = { x, y }
  while (isTaken(at)) {
    at.x += IDEA_STEP
    at.y += IDEA_STEP
  }
  return at
}
