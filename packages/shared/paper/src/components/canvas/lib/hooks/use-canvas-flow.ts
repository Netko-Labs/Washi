import type { WsxElement } from '@washi/wsx'
import { addEdge, type Connection, useEdgesState, useNodesState } from '@xyflow/react'
import { useEffect } from 'react'
import type { IdeaEdge, IdeaNode } from '../types'
import { fromWsx, nextId } from '../utils'

/** Flow state seeded from the markup, reseeded whenever the page's markup moves under it. */
export function useCanvasFlow(canvas: WsxElement, commit: (n: IdeaNode[], e: IdeaEdge[]) => void) {
  const [nodes, setNodes, onNodesChange] = useNodesState<IdeaNode>(fromWsx(canvas).nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<IdeaEdge>(fromWsx(canvas).edges)

  useEffect(() => {
    const next = fromWsx(canvas)
    setNodes(next.nodes)
    setEdges(next.edges)
  }, [canvas, setNodes, setEdges])

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onNodeDragStop: (_event: unknown, _node: IdeaNode, moved: IdeaNode[]) =>
      commit(
        nodes.map((node) => moved.find((each) => each.id === node.id) ?? node),
        edges,
      ),
    onNodesDelete: (gone: IdeaNode[]) => {
      const ids = new Set(gone.map((node) => node.id))
      commit(
        nodes.filter((node) => !ids.has(node.id)),
        edges.filter((edge) => !ids.has(edge.source) && !ids.has(edge.target)),
      )
    },
    onEdgesDelete: (gone: IdeaEdge[]) => {
      const ids = new Set(gone.map((edge) => edge.id))
      commit(
        nodes,
        edges.filter((edge) => !ids.has(edge.id)),
      )
    },
    onConnect: (connection: Connection) => {
      const id = `${connection.source}->${connection.target}`
      commit(nodes, addEdge({ ...connection, id }, edges))
    },
    addNode: (x: number, y: number) =>
      commit(
        [
          ...nodes,
          {
            id: nextId(nodes),
            type: 'idea',
            position: { x, y },
            data: { label: 'New idea', tone: null, page: null },
          },
        ],
        edges,
      ),
    rename: (id: string, label: string) =>
      commit(
        nodes.map((node) => (node.id === id ? { ...node, data: { ...node.data, label } } : node)),
        edges,
      ),
  }
}
