import { IconHome } from '@tabler/icons-react'
import { useState } from 'react'
import { SheetIcon } from '../sheet-icon'
import { useSheetsStore } from '../stores'
import type { MovePickerProps } from './lib'

const ROW =
  'flex w-full items-center gap-2 rounded-lg px-2 py-[7px] text-left text-[12.5px] hover:bg-accent'

/** "Move to page…": any page the person can read, or Home. */
export function MovePicker({ current, onPick }: MovePickerProps) {
  const sheets = useSheetsStore((state) => state.sheets)
  const [term, setTerm] = useState('')
  const needle = term.trim().toLowerCase()
  const pages = sheets
    .filter((sheet) => sheet.id !== current)
    .filter((sheet) => !needle || sheet.title.toLowerCase().includes(needle))
    .slice(0, 8)

  return (
    <>
      <input
        ref={(node) => node?.focus()}
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Move to which page?"
        aria-label="Move to which page?"
        className="mb-1 h-8 w-full rounded-lg border border-border bg-background px-2 text-[12.5px] outline-none focus-visible:border-primary"
      />
      <div className="max-h-[260px] overflow-y-auto">
        {current !== null && !needle && (
          <button type="button" onClick={() => onPick(null)} className={ROW}>
            <IconHome className="size-4 text-muted-foreground" />
            Home
          </button>
        )}
        {pages.map((sheet) => (
          <button key={sheet.id} type="button" onClick={() => onPick(sheet.id)} className={ROW}>
            <SheetIcon name={sheet.icon} className="size-4 text-muted-foreground" />
            <span className="truncate">{sheet.title}</span>
          </button>
        ))}
        {pages.length === 0 && (
          <p className="px-2 py-3 text-[12px] text-muted-foreground">Nothing matches that.</p>
        )}
      </div>
    </>
  )
}
