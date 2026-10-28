import type { KeyboardEvent, PointerEvent } from 'react'
import { type ColumnGapProps, useEditorStore } from './lib'

/** The gap between two columns; dragged, it moves their shares in sixths. */
export function ColumnGap({ columnsId, index, share }: ColumnGapProps) {
  const nudge = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0
    if (!step) return
    event.preventDefault()
    useEditorStore.getState().resize(columnsId, index, share / 100 + step / 6)
  }

  const start = (event: PointerEvent<HTMLDivElement>) => {
    const gap = event.currentTarget
    const left = gap.previousElementSibling?.getBoundingClientRect()
    const right = gap.nextElementSibling?.getBoundingClientRect()
    if (!left || !right) return
    event.preventDefault()
    gap.setPointerCapture(event.pointerId)
    const span = right.right - left.left
    const follow = (move: globalThis.PointerEvent) =>
      useEditorStore.getState().resize(columnsId, index, (move.clientX - left.left) / span)
    const stop = () => {
      gap.removeEventListener('pointermove', follow)
      gap.removeEventListener('pointerup', stop)
    }
    gap.addEventListener('pointermove', follow)
    gap.addEventListener('pointerup', stop)
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize the columns — drag, or ← →"
      aria-valuenow={share}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onKeyDown={nudge}
      onPointerDown={start}
      className="page-editor-gap group/gap relative w-10 shrink-0 cursor-col-resize touch-none outline-none"
    >
      <span className="absolute inset-y-1 left-[11px] w-[3px] rounded-full bg-transparent transition-colors group-hover/gap:bg-border group-focus-visible/gap:bg-primary group-active/gap:bg-primary" />
    </div>
  )
}
