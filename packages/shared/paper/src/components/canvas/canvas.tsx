import { Background, Controls, ReactFlow, ReactFlowProvider } from '@xyflow/react'
import { reachOf } from '../../lib'
import { usePaperHost } from '../../provider'
import { IdeaNode } from './idea-node'
import {
  CanvasContext,
  type CanvasProps,
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
  const actions = { commit, rename: flow.rename, open: (page: string) => host.openSheet(page) }

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
          <button
            type="button"
            className="wsx-canvas-add"
            onClick={() =>
              flow.addNode(40 * (flow.nodes.length % 6), 80 * Math.floor(flow.nodes.length / 6))
            }
          >
            + Idea
          </button>
        )}
      </div>
    </CanvasContext.Provider>
  )
}
