import { IconFileText } from '@tabler/icons-react'
import type { SheetListItem } from '@/lib/types'

export function SheetList({
  sheets,
  activeId,
  onSelect,
}: {
  sheets: SheetListItem[]
  activeId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <ul className="grid gap-0.5">
      {sheets.map((sheet) => (
        <li key={sheet.id}>
          <button
            type="button"
            onClick={() => onSelect(sheet.id)}
            aria-current={sheet.id === activeId ? 'page' : undefined}
            className={`flex h-11 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[13.5px] ${
              sheet.id === activeId ? 'bg-accent font-bold' : 'hover:bg-accent/50'
            }`}
          >
            {sheet.icon ? (
              <span className="shrink-0 text-[15px]">{sheet.icon}</span>
            ) : (
              <IconFileText className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className="min-w-0 flex-1 truncate">{sheet.title}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
