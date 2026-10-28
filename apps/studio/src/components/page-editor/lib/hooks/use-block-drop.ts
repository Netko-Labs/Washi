import type { DragEvent } from 'react'
import { SIDE_DROP } from '../constants'
import { useEditorStore } from '../editor-store'
import type { DropPlace } from '../types'

function placeOf(event: DragEvent<HTMLElement>): DropPlace {
  const box = event.currentTarget.getBoundingClientRect()
  const x = (event.clientX - box.left) / box.width
  if (x < SIDE_DROP) return 'left'
  if (x > 1 - SIDE_DROP) return 'right'
  return event.clientY - box.top < box.height / 2 ? 'before' : 'after'
}

/** A row as a drop target: where the dragged block would land, and the handlers that land it. */
export function useBlockDrop(id: string) {
  const place = useEditorStore((state) => (state.drop?.id === id ? state.drop.place : null))
  const store = useEditorStore.getState

  return {
    place,
    onDragOver: (event: DragEvent<HTMLElement>) => {
      const { dragging } = store()
      if (!dragging || dragging === id) return
      // The innermost row decides; a row of columns only takes what lands on its own edges.
      event.preventDefault()
      event.stopPropagation()
      event.dataTransfer.dropEffect = 'move'
      store().setDrop({ id, place: placeOf(event) })
    },
    onDrop: (event: DragEvent<HTMLElement>) => {
      const { dragging } = store()
      if (!dragging) return
      event.preventDefault()
      event.stopPropagation()
      store().moveTo(dragging, id, placeOf(event))
    },
  }
}
