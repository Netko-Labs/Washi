import { type PointerEvent, useEffect, useState } from 'react'
import type { BarDrag } from '../types'

/**
 * Dragging a bar sideways moves it by whole days. The dropped position holds until the row's
 * own dates change (`at`), so the bar never snaps back while the write is on its way; a
 * refused write puts it back.
 */
export function useBarDrag(
  dayWidth: () => number,
  at: number | null,
  onMove: (days: number) => Promise<void>,
): BarDrag {
  const [shift, setShift] = useState(0)

  useEffect(() => setShift(0), [at])

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    event.preventDefault()
    const from = event.clientX
    const width = dayWidth()
    const target = event.currentTarget
    target.setPointerCapture(event.pointerId)
    const days = (x: number) => (width > 0 ? Math.round((x - from) / width) : 0)
    const move = (next: globalThis.PointerEvent) => setShift(days(next.clientX))
    const up = (next: globalThis.PointerEvent) => {
      target.removeEventListener('pointermove', move)
      target.removeEventListener('pointerup', up)
      const moved = days(next.clientX)
      if (moved === 0) return setShift(0)
      setShift(moved)
      onMove(moved).catch(() => setShift(0))
    }
    target.addEventListener('pointermove', move)
    target.addEventListener('pointerup', up)
  }

  return { shift, onPointerDown }
}
