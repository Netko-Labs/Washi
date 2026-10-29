import { IconArrowRight } from '@tabler/icons-react'
import { useSheetsStore, useViewStore } from '../stores'
import type { HandoffDividerProps } from './lib'

/** A quiet line where the chat moved (D110); the place is a link. */
export function HandoffDivider({ handoff }: HandoffDividerProps) {
  const title = useSheetsStore(
    (state) => state.sheets.find((sheet) => sheet.id === handoff.to)?.title ?? handoff.title,
  )
  const open = () =>
    useViewStore.getState().openTab(handoff.to ? `note:${handoff.to}` : 'view:dashboard')

  return (
    <div className="my-2 flex items-center gap-2 text-[11.5px] text-muted-foreground" data-handoff>
      <span className="h-px flex-1 bg-border" />
      <button
        type="button"
        onClick={open}
        title={handoff.note}
        className="flex min-w-0 items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-accent hover:text-foreground"
      >
        <span className="truncate">
          Moved to <span className="font-medium">{handoff.to ? title : 'Home'}</span>
        </span>
        <IconArrowRight className="size-3 shrink-0" />
      </button>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
