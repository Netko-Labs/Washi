import { IconSearch, IconSparkles } from '@tabler/icons-react'
import { Command } from 'cmdk'
import { useEffect } from 'react'
import { SheetIcon } from '../sheet-icon'
import { useAgentStore } from '../stores/agent/agent-store'
import { useSheetsStore } from '../stores/sheets/sheets-store'
import { useViewStore } from '../stores/view/view-store'

/** ⌘K palette per Washi.dc.html: scrim, 560px panel at 14vh, pages + agent actions. */
export function CommandPalette() {
  const { sheets, paletteOpen, openPalette, closePalette, createSheet, searchTerm, search } =
    useSheetsStore()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        openPalette()
      }
      if (event.key === 'Escape') closePalette()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [openPalette, closePalette])

  if (!paletteOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close command palette"
        tabIndex={-1}
        className="absolute inset-0 h-full w-full cursor-default bg-black/50"
        onClick={closePalette}
      />
      <Command
        label="Command palette"
        shouldFilter
        className="relative mx-auto mt-[14vh] w-[min(560px,calc(100vw-24px))] overflow-hidden rounded-[14px] border border-border bg-popover text-popover-foreground shadow-[0_16px_48px_rgb(0_0_0/0.28)]"
      >
        <div className="flex items-center gap-2.5 border-border border-b px-4">
          <IconSearch className="size-4 text-muted-foreground" />
          <Command.Input
            autoFocus
            value={searchTerm}
            onValueChange={(value) => void search(value)}
            placeholder="Search pages, blocks and agents…"
            className="h-11 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            esc
          </kbd>
        </div>
        <Command.List className="max-h-[320px] overflow-y-auto p-1.5">
          <Command.Empty className="px-3 py-6 text-center text-[13px] text-muted-foreground">
            No matches for that.
          </Command.Empty>
          <Command.Group
            heading="Pages"
            className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.06em]"
          >
            {sheets.map((sheet) => (
              <Command.Item
                key={sheet.id}
                value={`${sheet.title} ${sheet.id}`}
                onSelect={() => {
                  useViewStore.getState().openTab(`note:${sheet.id}`)
                  closePalette()
                }}
                className="flex h-9 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-[13px] data-[selected=true]:bg-accent"
              >
                <SheetIcon name={sheet.icon} className="size-4 text-muted-foreground" />
                <span className="truncate">{sheet.title}</span>
              </Command.Item>
            ))}
          </Command.Group>
          <Command.Group
            heading="Agents"
            className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.06em]"
          >
            <Command.Item
              value="new page create"
              onSelect={() => {
                void createSheet()
                closePalette()
                if (!useAgentStore.getState().panelOpen) useAgentStore.getState().togglePanel()
              }}
              className="flex h-9 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-[13px] data-[selected=true]:bg-accent"
            >
              <span className="grid size-[18px] place-items-center rounded-full bg-agent font-semibold text-[9px] text-white">
                AI
              </span>
              Ask Washi to draft a page
              <kbd className="ml-auto rounded border border-border bg-muted px-1 font-mono text-[10px] text-muted-foreground">
                ⌘⏎
              </kbd>
            </Command.Item>
            <Command.Item
              value="blank new sheet"
              onSelect={() => {
                void createSheet()
                closePalette()
              }}
              className="flex h-9 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-[13px] data-[selected=true]:bg-accent"
            >
              <IconSparkles className="size-4 text-muted-foreground" />
              New blank page
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  )
}
