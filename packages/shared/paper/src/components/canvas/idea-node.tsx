import { Handle, type NodeProps, Position } from '@xyflow/react'
import { useState } from 'react'
import { type IdeaNode as IdeaNodeType, useCanvasActions } from './lib'

/** One idea: a label in a tone, maybe a page behind it. Double-click to rename. */
export function IdeaNode({ id, data, selected }: NodeProps<IdeaNodeType>) {
  const actions = useCanvasActions()
  const [editing, setEditing] = useState(false)

  return (
    <div
      className="wsx-canvas-node"
      data-tone={data.tone ?? undefined}
      data-selected={selected || undefined}
    >
      <Handle type="target" position={Position.Left} />
      {editing ? (
        <input
          // biome-ignore lint/a11y/noAutofocus: renaming starts because the person asked for it
          autoFocus
          className="wsx-canvas-input nodrag"
          defaultValue={data.label}
          aria-label="Rename this idea"
          onBlur={(event) => {
            setEditing(false)
            const label = event.currentTarget.value.trim()
            if (label && label !== data.label) actions.rename(id, label)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
            if (event.key === 'Escape') setEditing(false)
          }}
        />
      ) : (
        <button
          type="button"
          className="wsx-canvas-label"
          title="Double-click to rename"
          onDoubleClick={() => setEditing(true)}
          onKeyDown={(event) => event.key === 'Enter' && setEditing(true)}
        >
          {data.label}
        </button>
      )}
      {data.page && !editing && (
        <button
          type="button"
          className="wsx-canvas-open nodrag"
          aria-label="Open the page"
          onClick={() => data.page && actions.open(data.page)}
        >
          ↗
        </button>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
