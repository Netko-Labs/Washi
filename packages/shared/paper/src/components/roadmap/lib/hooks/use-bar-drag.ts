import { type PointerEvent, useState } from 'react'
import type { BarDrag } from '../types'

/**
 * Dragging a bar sideways moves it by whole days. A shift belongs to the dates it was made
 * against (`at`): the dropped position holds while the write is on its way, and the render the
 * new dates arrive in already drops it. A refused write puts the bar back.
 */
export function useBarDrag(
  dayWidth: () => number,
  at: number | null,
  onMove: (days: number) => Promise<void>,
): BarDrag {
  const [drag, setDrag] = useState<{ at: number | null; days: number }>({ at, days: 0 })

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    event.preventDefault()
    const from = event.clientX
    const width = dayWidth()
    const target = event.currentTarget
    target.setPointerCapture(event.pointerId)
    const days = (x: number) => (width > 0 ? Math.round((x - from) / width) : 0)
    const move = (next: globalThis.PointerEvent) => setDrag({ at, days: days(next.clientX) })
    const up = (next: globalThis.PointerEvent) => {
      target.removeEventListener('pointermove', move)
      target.removeEventListener('pointerup', up)
      const moved = days(next.clientX)
      setDrag({ at, days: moved })
      if (moved !== 0) onMove(moved).catch(() => setDrag({ at, days: 0 }))
    }
    target.addEventListener('pointermove', move)
    target.addEventListener('pointerup', up)
  }

  return { shift: drag.at === at ? drag.days : 0, onPointerDown }
}
