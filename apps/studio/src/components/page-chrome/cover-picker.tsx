import { useRef } from 'react'
import { useDismiss } from '@/components/shared/dismiss'
import { COVERS, type PickerProps } from './lib'

export function CoverPicker({ current, onPick, onClose }: PickerProps) {
  const root = useRef<HTMLDivElement>(null)
  useDismiss(root, true, onClose)

  return (
    <div
      ref={root}
      role="dialog"
      aria-label="Choose a cover"
      className="absolute top-full right-0 z-40 mt-1 w-[300px] rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-[0_16px_48px_rgb(0_0_0/0.18)]"
    >
      <div className="flex items-center justify-between px-1 pb-1.5">
        <span className="font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em]">
          Cover
        </span>
        {current && (
          <button
            type="button"
            onClick={() => onPick(null)}
            className="rounded px-1.5 py-0.5 text-[12px] text-muted-foreground hover:bg-accent"
          >
            Remove
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {Object.entries(COVERS).map(([key, cover]) => (
          <button
            key={key}
            type="button"
            onClick={() => onPick(key)}
            className={`flex h-14 items-end rounded-lg p-1.5 text-left ring-offset-2 ring-offset-popover ${
              current === key ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-border'
            }`}
            style={{ background: cover.background }}
          >
            <span className="rounded bg-black/35 px-1 font-medium text-[10.5px] text-white">
              {cover.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
