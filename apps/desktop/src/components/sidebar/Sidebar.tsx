import { IconFilePlus, IconSearch, IconTrash, IconX } from '@tabler/icons-react'
import { useSheetsStore } from '@/stores/sheets/sheets-store'

/** HLC stamps lead with zero-padded wall-clock ms — cheap relative time. */
function relativeTime(hlc: string): string {
  const ms = Number(hlc.slice(0, 14))
  if (!Number.isFinite(ms) || ms === 0) return ''
  const minutes = Math.floor((Date.now() - ms) / 60_000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h`
  return `${Math.floor(minutes / (60 * 24))}d`
}

export function Sidebar() {
  const { sheets, activeId, searchTerm, searchHits, select, createSheet, deleteSheet, search } =
    useSheetsStore()
  const searching = searchTerm.trim().length > 0

  return (
    <aside className="flex w-64 shrink-0 flex-col border-border border-r bg-secondary/50">
      <div className="flex items-center gap-1 px-3 pt-3 pb-1.5">
        <div className="relative flex-1">
          <IconSearch className="absolute top-1.5 left-2 size-4 text-muted-foreground" />
          <input
            value={searchTerm}
            onChange={(event) => void search(event.target.value)}
            placeholder="Search sheets"
            className="h-7 w-full rounded-md border border-input bg-card pr-6 pl-7 text-sm outline-none focus:ring-1 focus:ring-ring"
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

      <div className="flex items-center gap-2 px-4 pt-2 pb-1">
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
          {searching ? 'results' : 'sheets'}
        </span>
        <span className="h-0.5 flex-1 rounded-full bg-tape-pink/60" />
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
          : sheets.map((sheet) => {
              const active = sheet.id === activeId
              return (
                <div
                  key={sheet.id}
                  className={`group relative flex items-center rounded-md ${
                    active ? 'bg-card shadow-sm' : 'hover:bg-accent/60'
                  }`}
                >
                  {active && (
                    <span className="absolute top-1.5 bottom-1.5 left-0 w-0.75 rounded-full bg-tape-pink" />
                  )}
                  <button
                    type="button"
                    onClick={() => select(sheet.id)}
                    className="min-w-0 flex-1 px-2.5 py-1.5 text-left"
                  >
                    <span className="block truncate font-medium text-sm">
                      {sheet.icon ? `${sheet.icon} ` : ''}
                      {sheet.title}
                    </span>
                    <span className="block truncate font-mono text-[10px] text-muted-foreground">
                      {relativeTime(sheet.hlcUpdated)}
                      {sheet.tags.length > 0 ? ` · ${sheet.tags.join(' · ')}` : ''}
                    </span>
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
              )
            })}
        {searching && searchHits.length === 0 && (
          <div className="px-2 py-4 text-muted-foreground text-sm">no matches</div>
        )}
      </nav>
    </aside>
  )
}
