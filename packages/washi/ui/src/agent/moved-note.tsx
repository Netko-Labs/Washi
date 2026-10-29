import { IconArrowRight } from '@tabler/icons-react'
import { useAgentStore, useSheetsStore } from '../stores'

/** Under a page's draft: the newest chat that left this page, and where it went (D110). */
export function MovedNote() {
  const moved = useAgentStore((state) => (state.activeSessionId ? null : state.moved))
  const title = useSheetsStore((state) =>
    moved?.sheetId ? state.sheets.find((sheet) => sheet.id === moved.sheetId)?.title : 'Home',
  )
  if (!moved) return null

  return (
    <button
      type="button"
      onClick={() => useAgentStore.getState().visitMoved()}
      className="mx-3 mb-2 flex items-center gap-1 self-start rounded-md px-1.5 py-0.5 text-[11.5px] text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      1 conversation moved to <span className="font-medium">{title ?? 'a page'}</span>
      <IconArrowRight className="size-3" />
    </button>
  )
}
