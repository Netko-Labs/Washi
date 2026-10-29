import { IconHome } from '@tabler/icons-react'
import { SheetIcon } from '../sheet-icon'
import { useSheetsStore } from '../stores'
import type { ScopeChipProps } from './lib'

/** Where this chat lives: Home, or its page's icon and title (D110). */
export function ScopeChip({ sheetId }: ScopeChipProps) {
  const sheet = useSheetsStore((state) =>
    sheetId ? state.sheets.find((each) => each.id === sheetId) : undefined,
  )
  return (
    <span className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
      {sheetId ? (
        <SheetIcon name={sheet?.icon ?? null} className="size-3 shrink-0" />
      ) : (
        <IconHome className="size-3 shrink-0" />
      )}
      <span className="truncate">{sheetId ? (sheet?.title ?? 'A page') : 'Home'}</span>
    </span>
  )
}
