import { IconFolderUp } from '@tabler/icons-react'
import { childrenOf, isWithin, SheetIcon, useSheetsStore } from '@washi/ui'
import { useState } from 'react'
import type { PageMenuPanelProps } from './lib'

const ROW =
  'flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] hover:bg-accent'

/** Anywhere but inside itself; the page lands last among its new siblings. */
export function MoveToPanel({ sheet, onDone }: PageMenuPanelProps) {
  const sheets = useSheetsStore((state) => state.sheets)
  const [term, setTerm] = useState('')
  const needle = term.trim().toLowerCase()
  const targets = sheets.filter(
    (target) =>
      !isWithin(sheets, sheet.id, target.id) &&
      target.id !== sheet.parentId &&
      target.title.toLowerCase().includes(needle),
  )

  const moveUnder = (parentId: string | null) => {
    const index = childrenOf(sheets, parentId).filter((entry) => entry.id !== sheet.id).length
    void useSheetsStore.getState().moveSheet(sheet.id, { parentId, index })
    onDone()
  }

  return (
    <div className="p-1">
      <input
        ref={(node) => node?.focus()}
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Move to…"
        aria-label="Find a page to move into"
        className="mb-1 h-8 w-full rounded-lg border border-border bg-background px-2.5 text-[13px] outline-none focus-visible:border-primary"
      />
      <div className="max-h-[280px] overflow-y-auto">
        {sheet.parentId && !needle && (
          <button type="button" onClick={() => moveUnder(null)} className={ROW}>
            <IconFolderUp className="size-4 text-muted-foreground" />
            Top level
          </button>
        )}
        {targets.map((target) => (
          <button
            key={target.id}
            type="button"
            onClick={() => moveUnder(target.id)}
            className={ROW}
          >
            <SheetIcon name={target.icon} className="size-4 text-muted-foreground" />
            <span className="truncate">{target.title}</span>
          </button>
        ))}
        {targets.length === 0 && (
          <p className="px-2 py-1.5 text-[12.5px] text-muted-foreground">No page by that name.</p>
        )}
      </div>
    </div>
  )
}
