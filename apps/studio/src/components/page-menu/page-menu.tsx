import { IconDots } from '@tabler/icons-react'
import { useRef, useState } from 'react'
import { SharePanel } from '@/components/share'
import { useDismiss } from '@/components/shared/dismiss'
import type { PageMenuMode, PageMenuProps } from './lib'
import { MoveToPanel } from './move-to-panel'
import { PageMenuList } from './page-menu-list'
import { RenameForm } from './rename-form'

/** The ⋯ beside Copy link: what a person does to a page as a whole. */
export function PageMenu({ sheet, compact }: PageMenuProps) {
  const [mode, setMode] = useState<PageMenuMode | null>(null)
  const root = useRef<HTMLDivElement>(null)
  useDismiss(root, mode !== null, () => setMode(null))
  const close = () => setMode(null)

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label="Page options"
        aria-haspopup="dialog"
        aria-expanded={mode !== null}
        onClick={() => setMode(mode ? null : 'menu')}
        className={`grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent ${
          mode ? 'bg-accent' : ''
        }`}
      >
        <IconDots className="size-4" />
      </button>
      {mode && (
        <div
          role="dialog"
          aria-label="Page options"
          className={`absolute top-full right-0 z-40 mt-1 max-w-[calc(100vw-24px)] rounded-xl border border-border bg-popover text-popover-foreground shadow-[0_16px_48px_rgb(0_0_0/0.18)] ${
            mode === 'share' ? 'w-[340px] p-1.5' : 'w-[260px]'
          }`}
        >
          {mode === 'menu' && (
            <PageMenuList sheet={sheet} onMode={setMode} onDone={close} compact={compact} />
          )}
          {mode === 'share' && <SharePanel sheet={sheet} onClose={close} />}
          {mode === 'rename' && <RenameForm sheet={sheet} onDone={close} />}
          {mode === 'move' && <MoveToPanel sheet={sheet} onDone={close} />}
        </div>
      )}
    </div>
  )
}
