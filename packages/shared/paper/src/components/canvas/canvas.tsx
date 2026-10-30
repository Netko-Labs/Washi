import { Background, Controls, ReactFlow, ReactFlowProvider, useReactFlow } from '@xyflow/react'
import type { MouseEvent } from 'react'
import { reachOf } from '../../lib'
import { usePaperHost } from '../../provider'
import { IdeaNode } from './idea-node'
import {
  CanvasContext,
  type CanvasProps,
  IDEA_HALF,
  type IdeaNode as Idea,
  type IdeaEdge,
  toWsx,
  useCanvasFlow,
} from './lib'

const NODE_TYPES = { idea: IdeaNode }

/** A board of ideas and the lines between them — drawn by hand, written by Washi, the same markup. */
export function Canvas({ node }: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasFlow node={node} />
    </ReactFlowProvider>
  )
}

function CanvasFlow({ node }: CanvasProps) {
  const host = usePaperHost()
  const editable = Boolean(host.replaceNode)
  const commit = (nodes: Idea[], edges: IdeaEdge[]) => {
    void host.replaceNode?.(node, toWsx(node, nodes, edges))
  }
  const flow = useCanvasFlow(node, commit)
  const { screenToFlowPosition } = useReactFlow()
  const actions = { commit, rename: flow.rename, open: (page: string) => host.openSheet(page) }
  const addInView = (event: MouseEvent<HTMLButtonElement>) => {
    const pane = event.currentTarget.parentElement?.getBoundingClientRect()
    if (!pane) return
    const at = screenToFlowPosition({
      x: pane.left + pane.width / 2,
      y: pane.top + pane.height / 2,
    })
    flow.addNode(at.x - IDEA_HALF.width, at.y - IDEA_HALF.height)
  }

  return (
    <CanvasContext.Provider value={actions}>
      <div className="wsx-canvas" data-width={reachOf(node.props.width)}>
        <ReactFlow
          nodes={flow.nodes}
          edges={flow.edges}
          nodeTypes={NODE_TYPES}
          onNodesChange={flow.onNodesChange}
          onEdgesChange={flow.onEdgesChange}
          onNodeDragStop={flow.onNodeDragStop}
          onNodesDelete={flow.onNodesDelete}
          onEdgesDelete={flow.onEdgesDelete}
          onConnect={flow.onConnect}
          nodesDraggable={editable}
          nodesConnectable={editable}
          elementsSelectable={editable}
          deleteKeyCode={editable ? ['Backspace', 'Delete'] : null}
          fitView
        >
          <Background gap={20} />
          <Controls showInteractive={false} />
        </ReactFlow>
        {editable && (
          <button type="button" className="wsx-canvas-add" onClick={addInView}>
            + Idea
          </button>
        )}
      </div>
    </CanvasContext.Provider>
  )
}
