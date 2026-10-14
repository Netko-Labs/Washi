import { useRef } from 'react'
import { useDismiss } from '@/components/shared/dismiss'
import { EMOJI, type PickerProps } from './lib'

export function IconPicker({ current, onPick, onClose }: PickerProps) {
  const root = useRef<HTMLDivElement>(null)
  useDismiss(root, true, onClose)

  return (
    <div
      ref={root}
      role="dialog"
      aria-label="Choose an icon"
      className="absolute top-full left-0 z-40 mt-1 w-[300px] rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-[0_16px_48px_rgb(0_0_0/0.18)]"
    >
      <div className="flex items-center justify-between px-1 pb-1.5">
        <span className="font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em]">
          Icon
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
      <div className="grid grid-cols-8 gap-0.5">
        {EMOJI.map((emoji) => (
          <button
            key={emoji}
            type="button"
            aria-label={`Use ${emoji}`}
            onClick={() => onPick(emoji)}
            className={`grid size-8 place-items-center rounded-lg text-[18px] hover:bg-accent ${
              current === emoji ? 'bg-accent' : ''
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
