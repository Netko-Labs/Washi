import { IconDots, IconExternalLink, IconTrash } from '@tabler/icons-react'
import { Floating } from '@/components/shared/floating'
import { type DatabaseRowMenuProps, useRowMenu } from './lib'

const ITEM =
  'flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] hover:bg-accent'

/** Open it, or move it to the trash — asked once, in words, in place. */
export function DatabaseRowMenu({ name, onOpen, onTrash }: DatabaseRowMenuProps) {
  const menu = useRowMenu()
  const trash = async () => {
    if (await onTrash()) menu.close()
  }

  return (
    <div ref={menu.root} className="relative">
      <button
        type="button"
        onClick={menu.isOpen ? menu.close : menu.open}
        aria-label={`Actions for ${name}`}
        aria-expanded={menu.isOpen}
        className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground aria-expanded:bg-accent aria-expanded:text-foreground"
      >
        <IconDots className="size-[18px]" />
      </button>
      {menu.isOpen && (
        <Floating
          anchor={menu.root}
          align="end"
          offset={6}
          role="menu"
          aria-label={`Actions for ${name}`}
          className="w-[240px] rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-[0_16px_48px_rgb(0_0_0/0.22)]"
        >
          {menu.isConfirming ? (
            <div className="p-2">
              <p className="text-[13px]">
                Move “{name}” to the trash? Its rows wait there with it; pages showing it go quiet
                until you restore it.
              </p>
              <div className="mt-2.5 flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={menu.close}
                  className="h-[30px] rounded-lg px-2.5 text-[12.5px] text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  Keep it
                </button>
                <button
                  type="button"
                  onClick={() => void trash()}
                  className="h-[30px] rounded-lg bg-destructive px-3 font-medium text-[12.5px] text-destructive-foreground"
                >
                  Move to trash
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  menu.close()
                  onOpen()
                }}
                className={ITEM}
              >
                <IconExternalLink className="size-4 text-muted-foreground" />
                Open
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={menu.confirm}
                className={`${ITEM} text-destructive`}
              >
                <IconTrash className="size-4" />
                Move to trash
              </button>
            </>
          )}
        </Floating>
      )}
    </div>
  )
}
