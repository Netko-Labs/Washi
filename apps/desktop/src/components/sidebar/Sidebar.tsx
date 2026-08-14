import {
  IconChevronDown,
  IconCircleDot,
  IconFileText,
  IconPlus,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react'
import { VaultIcon } from '@/components/mascot/VaultIcon'
import { useAgentStore } from '@/stores/agent/agent-store'
import { useSheetsStore } from '@/stores/sheets/sheets-store'

/** 248px sidebar per Washi.dc.html: switcher, search, tree, sync row. */
export function Sidebar() {
  const { sheets, activeId, select, createSheet, deleteSheet, openPalette } = useSheetsStore()
  const running = useAgentStore((state) => state.running)

  return (
    <aside className="flex w-[248px] shrink-0 flex-col border-border border-r bg-muted">
      {/* real traffic lights live here (hiddenInset) — keep it draggable */}
      <div className="h-9 shrink-0" style={{ appRegion: 'drag' } as never} />

      <button
        type="button"
        className="mx-2 flex items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left hover:bg-accent"
        data-workspace-switcher
      >
        <VaultIcon topic="journal" size={26} className="rounded-lg" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-[13px]">Personal vault</span>
          <span className="block truncate text-[11px] text-muted-foreground">
            {sheets.length} pages · local
          </span>
        </span>
        <IconChevronDown className="size-3.5 text-muted-foreground" />
      </button>

      <div className="px-2 pt-2">
        <button
          type="button"
          onClick={openPalette}
          className="flex h-8 w-full items-center gap-2 rounded-[10px] border border-border bg-background px-2.5 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <IconSearch className="size-3.5" />
          Search sheets
          <kbd className="ml-auto rounded border border-border bg-muted px-1 font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="px-4 pt-[18px] pb-1.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em]">
        Workspace
      </div>

      <nav className="flex-1 space-y-px overflow-y-auto px-2 pb-2">
        {sheets.map((sheet) => {
          const active = sheet.id === activeId
          return (
            <div
              key={sheet.id}
              className={`group flex h-[29px] items-center rounded-lg ${
                active ? 'bg-accent font-medium' : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              <button
                type="button"
                onClick={() => select(sheet.id)}
                className="flex h-full min-w-0 flex-1 items-center gap-2 px-2 text-left text-[13px]"
              >
                <IconFileText className="size-[15px] shrink-0" />
                <span className="truncate">
                  {sheet.icon ? `${sheet.icon} ` : ''}
                  {sheet.title}
                </span>
                {active && running && (
                  <span
                    className="ml-auto size-1.5 shrink-0 rounded-full bg-agent"
                    style={{ animation: 'wdot 2s ease-in-out infinite' }}
                  />
                )}
              </button>
              <button
                type="button"
                aria-label={`Delete ${sheet.title}`}
                onClick={() => void deleteSheet(sheet.id)}
                className="mr-1 hidden size-5 shrink-0 place-items-center rounded text-muted-foreground group-hover:grid hover:text-destructive"
              >
                <IconTrash className="size-3" />
              </button>
            </div>
          )
        })}
        <button
          type="button"
          aria-label="New sheet"
          onClick={() => void createSheet()}
          className="flex h-[29px] w-full items-center gap-2 rounded-lg px-2 text-[13px] text-muted-foreground hover:bg-accent"
        >
          <IconPlus className="size-3.5" />
          New page
        </button>
      </nav>

      <div className="flex items-center gap-2 border-border border-t px-3 py-2 text-[11.5px] text-muted-foreground">
        <IconCircleDot className="size-3.5 text-green-600" />
        Local · this device only
      </div>
    </aside>
  )
}
