import { IconFilePlus, IconSearch, IconTrash, IconX } from '@tabler/icons-react'
import { useSheetsStore } from '@/stores/sheets/sheets-store'

export function Sidebar() {
  const { sheets, activeId, searchTerm, searchHits, select, createSheet, deleteSheet, search } =
    useSheetsStore()
  const searching = searchTerm.trim().length > 0

  return (
    <aside className="flex w-64 shrink-0 flex-col border-border border-r bg-muted/30">
      <div className="flex items-center gap-1 px-3 pt-3 pb-2">
        <div className="relative flex-1">
          <IconSearch className="absolute top-1.5 left-2 size-4 text-muted-foreground" />
          <input
            value={searchTerm}
            onChange={(event) => void search(event.target.value)}
            placeholder="Search sheets"
            className="h-7 w-full rounded-md border border-input bg-background pr-6 pl-7 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
          {searching && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => void search('')}
              className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-foreground"
            >
              <IconX className="size-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          aria-label="New sheet"
          title="New sheet"
          onClick={() => void createSheet()}
          className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <IconFilePlus className="size-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-3">
        {searching
          ? searchHits.map((hit) => (
              <button
                key={hit.id}
                type="button"
                onClick={() => select(hit.id)}
                className="block w-full rounded-md px-2 py-1.5 text-left hover:bg-accent"
              >
                <div className="truncate font-medium text-sm">
                  {hit.icon ? `${hit.icon} ` : ''}
                  {hit.title}
                </div>
                <div className="truncate text-muted-foreground text-xs">{hit.snippet}</div>
              </button>
            ))
          : sheets.map((sheet) => (
              <div
                key={sheet.id}
                className={`group flex items-center rounded-md ${
                  sheet.id === activeId ? 'bg-accent' : 'hover:bg-accent/60'
                }`}
              >
                <button
                  type="button"
                  onClick={() => select(sheet.id)}
                  className="min-w-0 flex-1 truncate px-2 py-1.5 text-left text-sm"
                >
                  {sheet.icon ? `${sheet.icon} ` : ''}
                  {sheet.title}
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${sheet.title}`}
                  onClick={() => void deleteSheet(sheet.id)}
                  className="mr-1 hidden size-6 shrink-0 place-items-center rounded text-muted-foreground hover:text-destructive group-hover:grid"
                >
                  <IconTrash className="size-3.5" />
                </button>
              </div>
            ))}
        {searching && searchHits.length === 0 && (
          <div className="px-2 py-4 text-muted-foreground text-sm">no matches</div>
        )}
      </nav>
    </aside>
  )
}
