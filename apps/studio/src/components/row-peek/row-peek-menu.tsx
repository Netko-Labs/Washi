import { IconDots, IconLink, IconTrash } from '@tabler/icons-react'
import { useNoticeStore } from '@washi/ui'
import { useState } from 'react'
import { Floating } from '@/components/shared/floating'
import { type RowPeekMenuProps, useDeleteRow, usePeekMenu } from './lib'

const ITEM =
  'flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] hover:bg-accent'

/** The row's own actions: a link to its page, and deleting it — asked once, in place. */
export function RowPeekMenu({ sheetId, workspaceId, onDeleted }: RowPeekMenuProps) {
  const menu = usePeekMenu()
  const deleteRow = useDeleteRow()
  const [isConfirming, setConfirming] = useState(false)

  const close = () => {
    setConfirming(false)
    menu.close()
  }
  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/w/${workspaceId}/p/${sheetId}`)
    useNoticeStore.getState().say('Link copied')
    close()
  }
  const remove = async () => {
    if (await deleteRow(sheetId)) {
      close()
      onDeleted()
    }
  }

  return (
    <div ref={menu.root} className="relative">
      <button
        type="button"
        onClick={menu.isOpen ? close : menu.open}
        aria-label="Row actions"
        aria-expanded={menu.isOpen}
        title="Row actions"
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
          aria-label="Row actions"
          className="w-[220px] rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-[0_16px_48px_rgb(0_0_0/0.22)]"
        >
          {isConfirming ? (
            <div className="p-2">
              <p className="text-[13px]">Delete this row and its page? It goes to the trash.</p>
              <div className="mt-2.5 flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="h-[30px] rounded-lg px-2.5 text-[12.5px] text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  Keep it
                </button>
                <button
                  type="button"
                  onClick={() => void remove()}
                  className="h-[30px] rounded-lg bg-destructive px-3 font-medium text-[12.5px] text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={() => void copyLink()}
                className={ITEM}
              >
                <IconLink className="size-4 text-muted-foreground" />
                Copy link
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => setConfirming(true)}
                className={`${ITEM} text-destructive`}
              >
                <IconTrash className="size-4" />
                Delete row
              </button>
            </>
          )}
        </Floating>
      )}
    </div>
  )
}
