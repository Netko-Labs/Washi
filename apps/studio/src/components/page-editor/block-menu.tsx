import {
  IconArrowDown,
  IconArrowUp,
  IconCopy,
  IconGripVertical,
  IconTrash,
} from '@tabler/icons-react'
import { Floating } from '@/components/shared/floating'
import { type BlockMenuProps, KIND_OPTIONS, useBlockMenu, useEditorStore } from './lib'

const ITEM =
  'flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] hover:bg-black/5 dark:hover:bg-white/10'

/** The ⋮⋮ beside a block: turn it into another kind, move, duplicate or delete it. */
export function BlockMenu({ block }: BlockMenuProps) {
  const { isOpen, toggle, close, root, trigger, menu } = useBlockMenu()
  const store = useEditorStore.getState
  const act = (run: () => void) => {
    run()
    close()
  }

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-label="Block options — drag to move"
        aria-expanded={isOpen}
        draggable
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = 'move'
          event.dataTransfer.setData('text/plain', block.id)
          const row = event.currentTarget.closest('[data-block-row]')
          if (row) event.dataTransfer.setDragImage(row, 16, 16)
          store().setDragging(block.id)
        }}
        onDragEnd={() => store().setDragging(null)}
        onClick={toggle}
        className="grid size-6 cursor-grab place-items-center rounded text-muted-foreground hover:bg-black/5 active:cursor-grabbing dark:hover:bg-white/10"
      >
        <IconGripVertical className="size-4" />
      </button>
      {isOpen && (
        <Floating
          anchor={root}
          offset={4}
          role="menu"
          aria-label="Block options"
          className="max-h-[calc(100dvh-16px)] w-[220px] overflow-y-auto rounded-xl border border-border bg-popover p-1 font-sans text-popover-foreground shadow-[0_16px_48px_rgb(0_0_0/0.18)]"
        >
          <div ref={menu}>
            {'text' in block && (
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
              onClick={() => act(() => store().duplicate(block.id))}
              className={ITEM}
            >
              <IconCopy className="size-4 text-muted-foreground" />
              Duplicate
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
        </Floating>
      )}
    </div>
  )
}
