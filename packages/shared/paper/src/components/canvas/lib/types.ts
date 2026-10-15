import type { WsxElement } from '@washi/wsx'
import type { Edge, Node } from '@xyflow/react'
import type { Tone } from '../../../lib/types'

export interface IdeaData extends Record<string, unknown> {
  label: string
  tone: Tone | null
  page: string | null
}

export type IdeaNode = Node<IdeaData, 'idea'>
export type IdeaEdge = Edge

export interface CanvasProps {
  node: WsxElement
}

export interface CanvasActions {
  /** Writes the canvas back into its page — positions, links, names, deletions alike. */
  commit: (nodes: IdeaNode[], edges: IdeaEdge[]) => void
  rename: (id: string, label: string) => void
  open: (page: string) => void
}
