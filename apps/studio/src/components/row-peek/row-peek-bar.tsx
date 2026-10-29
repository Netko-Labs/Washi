import { IconArrowsDiagonal, IconX } from '@tabler/icons-react'
import { useRef } from 'react'
import { useSwipe } from '@/components/shared/gestures'
import { PEEK_DISMISS_SWIPE, type RowPeekBarProps } from './lib'
import { RowPeekMenu } from './row-peek-menu'

const ICON_BUTTON =
  'grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'

export function RowPeekBar({ onClose, onExpand, sheetId, workspaceId }: RowPeekBarProps) {
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
      className="absolute inset-x-0 top-0 z-10 flex h-11 touch-none items-center gap-0.5 px-2 backdrop-blur-md max-md:h-14 max-md:pt-2"
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
        <IconX className="size-[18px]" />
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
      <div className="ml-auto">
        <RowPeekMenu sheetId={sheetId} workspaceId={workspaceId} onDeleted={onClose} />
      </div>
    </div>
  )
}
