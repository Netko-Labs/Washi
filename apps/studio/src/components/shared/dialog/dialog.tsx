import { useRef } from 'react'
import { useDismiss } from '@/components/shared/dismiss'
import type { DialogProps } from './types'

/** A scrim and a card. Escape or a press outside closes it; the caller owns what is inside. */
export function Dialog({ label, onClose, children, width = 420 }: DialogProps) {
  const root = useRef<HTMLDivElement>(null)
  useDismiss(root, true, onClose)

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/40 p-4">
      <div
        ref={root}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        style={{ width: `min(${width}px, 100%)` }}
        className="grid gap-3 rounded-2xl border border-border bg-popover p-[18px] text-popover-foreground shadow-[0_30px_70px_-20px_rgb(0_0_0/0.4)]"
      >
        {children}
      </div>
    </div>
  )
}
