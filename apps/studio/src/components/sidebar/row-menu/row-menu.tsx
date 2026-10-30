import { IconDots, IconPlus, IconTrash } from '@tabler/icons-react'
import { useSheetsStore } from '@washi/ui'
import { useState } from 'react'
import { BottomSheet, SHEET_ROW } from '@/components/shared/bottom-sheet'
import type { RowMenuProps } from '../lib'

/** A phone's ⋯ on a sidebar row: what a wide sidebar shows on hover, which a touch never does. */
export function RowMenu({ sheet, onAddInside }: RowMenuProps) {
  const [isOpen, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <>
      <button
        type="button"
        aria-label={`Options for ${sheet.title}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setOpen(true)}
        className="mr-1 grid size-10 shrink-0 place-items-center rounded-lg text-muted-foreground md:hidden"
      >
        <IconDots className="size-[18px]" />
      </button>
      {isOpen && (
        <BottomSheet label={sheet.title} onClose={close}>
          <p className="truncate px-3 pt-1 pb-2 font-medium text-[13px] text-muted-foreground">
            {sheet.title}
          </p>
          {onAddInside && (
            <button
              type="button"
              onClick={() => {
                close()
                onAddInside()
              }}
              className={SHEET_ROW}
            >
              <IconPlus className="size-[18px] text-muted-foreground" />
              Add a page inside
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              close()
              void useSheetsStore.getState().deleteSheet(sheet.id)
            }}
            className={`${SHEET_ROW} text-destructive`}
          >
            <IconTrash className="size-[18px]" />
            Move to Trash
          </button>
        </BottomSheet>
      )}
    </>
  )
}
