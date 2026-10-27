import { IconArrowsDiagonal, IconChevronsRight, IconX } from '@tabler/icons-react'
import { useRef } from 'react'
import { useSwipe } from '@/components/shared/gestures'
import { PEEK_DISMISS_SWIPE, PEEK_MODES, type RowPeekBarProps } from './lib'

const ICON_BUTTON =
  'grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'

export function RowPeekBar({ mode, onMode, onClose, onExpand }: RowPeekBarProps) {
  const Close = mode === 'side' ? IconChevronsRight : IconX
  const bar = useRef<HTMLDivElement>(null)
  // On a phone the peek is a sheet: its bar is the grip that pulls it down and away.
  useSwipe(bar, {
    axis: 'y',
    sign: 1,
    distance: PEEK_DISMISS_SWIPE,
    follower: (el) => el.closest<HTMLElement>('[role="dialog"]'),
    onSwipe: onClose,
  })
  return (
    <div
      ref={bar}
      className="relative flex h-12 shrink-0 touch-none items-center gap-1 border-border/70 border-b px-2.5 max-md:h-14 max-md:pt-2"
    >
      <span
        aria-hidden
        className="absolute top-1.5 left-1/2 h-1 w-9 -translate-x-1/2 rounded-full bg-foreground/20 md:hidden"
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        title="Close · Esc"
        className={ICON_BUTTON}
      >
        <Close className="size-[18px]" />
      </button>
      <button
        type="button"
        onClick={onExpand}
        aria-label="Open as page"
        title="Open as page"
        className={ICON_BUTTON}
      >
        <IconArrowsDiagonal className="size-[17px]" />
      </button>
      <div
        role="radiogroup"
        aria-label="Peek"
        className="ml-auto flex items-center gap-0.5 rounded-lg bg-foreground/[0.05] p-0.5"
      >
        {PEEK_MODES.map(({ mode: each, label, icon: Icon }) => (
          <button
            key={each}
            type="button"
            role="radio"
            aria-checked={mode === each}
            aria-label={label}
            title={label}
            onClick={() => onMode(each)}
            className={`grid h-7 w-8 place-items-center rounded-md transition-colors ${
              mode === each
                ? 'bg-card text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_1px_var(--border)]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="size-[15px]" />
          </button>
        ))}
      </div>
    </div>
  )
}
