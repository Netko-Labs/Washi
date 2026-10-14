import { IconPlus, IconTrash } from '@tabler/icons-react'
import { SheetIcon, useAgentStore, useSheetsStore, useViewStore } from '@washi/ui'

export function SidebarPages({ onNavigate }: { onNavigate: () => void }) {
  const sheets = useSheetsStore((state) => state.sheets)
  const running = useAgentStore((state) => state.running)
  const activeTab = useViewStore((state) => state.activeTab)

  return (
    <div className="min-h-0 flex-1 space-y-px overflow-y-auto px-2 pb-2">
      {sheets.length === 0 && (
        <p className="px-2 py-1 text-[12.5px] text-muted-foreground leading-relaxed">
          No pages yet. Ask Washi for one — there is nothing to type into here.
        </p>
      )}
      {sheets.map((sheet) => {
        const active = activeTab === `note:${sheet.id}`
        return (
          <div
            key={sheet.id}
            className={`group flex h-9 items-center rounded-lg md:h-[29px] ${
              active ? 'bg-accent font-medium' : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            <button
              type="button"
              aria-label={`Open ${sheet.title}`}
              onClick={() => {
                useViewStore.getState().openTab(`note:${sheet.id}`)
                onNavigate()
              }}
              className="flex h-full min-w-0 flex-1 items-center gap-2 px-2 text-left text-[13px]"
            >
              <SheetIcon name={sheet.icon} className="size-[15px] shrink-0" />
              <span className="truncate">{sheet.title}</span>
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
              onClick={() => void useSheetsStore.getState().deleteSheet(sheet.id)}
              className="mr-1 hidden size-6 shrink-0 place-items-center rounded text-muted-foreground group-hover:grid hover:text-destructive"
            >
              <IconTrash className="size-3" />
            </button>
          </div>
        )
      })}
      <button
        type="button"
        onClick={() => {
          void useSheetsStore.getState().createSheet()
          onNavigate()
        }}
        className="flex h-9 w-full items-center gap-2 rounded-lg px-2 text-[13px] text-muted-foreground hover:bg-accent md:h-[29px]"
      >
        <IconPlus className="size-3.5" />
        New page
      </button>
    </div>
  )
}
