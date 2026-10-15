import { type PointerEvent, useState } from 'react'
import type { BarDrag } from '../types'

/** Dragging a bar sideways moves it by whole days; the shift is shown until the write lands. */
export function useBarDrag(dayWidth: () => number, onMove: (days: number) => void): BarDrag {
  const [shift, setShift] = useState(0)

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
      setShift(0)
      if (moved !== 0) onMove(moved)
    }
    target.addEventListener('pointermove', move)
    target.addEventListener('pointerup', up)
  }

  return { shift, onPointerDown }
}
