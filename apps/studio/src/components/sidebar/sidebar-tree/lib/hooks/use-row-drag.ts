import type { SheetSummary } from '@washi/domain'
import { placementFor, useSheetsStore } from '@washi/ui'
import type { DragEvent } from 'react'
import { useTreeStore } from '../tree-store'
import { dropZone } from '../utils'

/** Native drag and drop: a row is a source and a target; a drop it cannot take is refused. */
export function useRowDrag(sheet: SheetSummary) {
  const drop = useTreeStore((state) => (state.over?.id === sheet.id ? state.over.drop : null))
  const isDragging = useTreeStore((state) => state.draggingId === sheet.id)

  const placementAt = (event: DragEvent<HTMLElement>) => {
    const { draggingId } = useTreeStore.getState()
    if (!draggingId) return null
    const zone = dropZone(event)
    const placement = placementFor(useSheetsStore.getState().sheets, draggingId, sheet.id, zone)
    return placement ? { draggingId, zone, placement } : null
  }

  return {
    drop,
    isDragging,
    handlers: {
      draggable: true,
      onDragStart: (event: DragEvent<HTMLElement>) => {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', sheet.title)
        useTreeStore.getState().startDrag(sheet.id)
      },
      onDragOver: (event: DragEvent<HTMLElement>) => {
        const target = placementAt(event)
        if (!target) {
          useTreeStore.getState().clearHover()
          return
        }
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        useTreeStore.getState().hover(sheet.id, target.zone)
      },
      onDrop: (event: DragEvent<HTMLElement>) => {
        event.preventDefault()
        const target = placementAt(event)
        useTreeStore.getState().endDrag()
        if (!target) return
        if (target.zone === 'inside') useTreeStore.getState().expand([sheet.id])
        useSheetsStore
          .getState()
          .moveSheet(target.draggingId, target.placement)
          .catch(() => useTreeStore.getState().report('That move did not save — the page is back.'))
      },
      onDragEnd: () => useTreeStore.getState().endDrag(),
    },
  }
}
