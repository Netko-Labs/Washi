import { IconArrowsDiagonal, IconChevronsRight, IconX } from '@tabler/icons-react'
import { PEEK_MODES, type RowPeekBarProps } from './lib'

const ICON_BUTTON =
  'grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'

export function RowPeekBar({ mode, onMode, onClose, onExpand }: RowPeekBarProps) {
  const Close = mode === 'side' ? IconChevronsRight : IconX
  return (
    <div className="flex h-12 shrink-0 items-center gap-1 border-border/70 border-b px-2.5">
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
