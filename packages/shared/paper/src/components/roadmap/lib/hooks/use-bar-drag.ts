import { type PointerEvent, useState } from 'react'
import type { BarDrag, DragShift } from '../types'

/**
 * Dragging a bar sideways moves it by whole days. While the pointer is down the bar follows it,
 * whatever lands meanwhile. After the drop the shift belongs to the dates it was made against
 * (`at`): it holds while the write is on its way, and the render the new dates arrive in drops
 * it. A refused write puts the bar back.
 */
export function useBarDrag(
  dayWidth: () => number,
  at: number | null,
  onMove: (days: number) => Promise<void>,
): BarDrag {
  const [drag, setDrag] = useState<DragShift>({ at, days: 0, held: false })

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    event.preventDefault()
    const from = event.clientX
    const width = dayWidth()
    const target = event.currentTarget
    target.setPointerCapture(event.pointerId)
    const days = (x: number) => (width > 0 ? Math.round((x - from) / width) : 0)
    const move = (next: globalThis.PointerEvent) =>
      setDrag({ at, days: days(next.clientX), held: true })
    const up = (next: globalThis.PointerEvent) => {
      target.removeEventListener('pointermove', move)
      target.removeEventListener('pointerup', up)
      const moved = days(next.clientX)
      setDrag({ at, days: moved, held: false })
      if (moved !== 0) onMove(moved).catch(() => setDrag({ at, days: 0, held: false }))
    }
    target.addEventListener('pointermove', move)
    target.addEventListener('pointerup', up)
  }

  return { shift: drag.held || drag.at === at ? drag.days : 0, onPointerDown }
}
