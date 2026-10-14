import { IconArrowDown, IconArrowUp, IconGripVertical, IconTrash } from '@tabler/icons-react'
import { useRef, useState } from 'react'
import { useDismiss } from '@/components/shared/dismiss'
import { type BlockMenuProps, KIND_OPTIONS, useEditorStore } from './lib'

const ITEM =
  'flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] hover:bg-black/5 dark:hover:bg-white/10'

/** The ⋮⋮ beside a block: turn it into another kind, move it, or delete it. */
export function BlockMenu({ block }: BlockMenuProps) {
  const [isOpen, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useDismiss(root, isOpen, () => setOpen(false))
  const store = useEditorStore.getState
  const act = (run: () => void) => {
    run()
    setOpen(false)
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label="Block options"
        aria-expanded={isOpen}
        onClick={() => setOpen(!isOpen)}
        className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10"
      >
        <IconGripVertical className="size-4" />
      </button>
      {isOpen && (
        <div
          role="menu"
          className="absolute top-full left-0 z-30 mt-1 w-[220px] rounded-xl border border-border bg-popover p-1 font-sans text-popover-foreground shadow-[0_16px_48px_rgb(0_0_0/0.18)]"
        >
          {block.kind !== 'locked' && (
            <>
              <div className="px-2 pt-1 pb-1 font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em]">
                Turn into
              </div>
              {KIND_OPTIONS.map((option) => (
                <button
                  key={option.kind}
                  type="button"
                  role="menuitem"
                  onClick={() => act(() => store().turnInto(block.id, option.kind))}
                  className={`${ITEM} ${option.kind === block.kind ? 'font-medium' : ''}`}
                >
                  {option.label}
                </button>
              ))}
              <div className="my-1 h-px bg-border" />
            </>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => act(() => store().move(block.id, -1))}
            className={ITEM}
          >
            <IconArrowUp className="size-4 text-muted-foreground" />
            Move up
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => act(() => store().move(block.id, 1))}
            className={ITEM}
          >
            <IconArrowDown className="size-4 text-muted-foreground" />
            Move down
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => act(() => store().remove(block.id))}
            className={`${ITEM} text-destructive`}
          >
            <IconTrash className="size-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
