import { IconSearch, IconSparkles } from '@tabler/icons-react'
import { Command } from 'cmdk'
import { SheetIcon } from '../sheet-icon'
import { useAgentStore, useNoticeStore, useSheetsStore, useViewStore } from '../stores'
import { usePalette } from './lib'

/** Free text is a question: a turn starts on screen, in a fresh chat if one is running. */
function askWashi(text: string) {
  const agent = useAgentStore.getState()
  if (agent.running) agent.startDraft()
  if (!agent.panelOpen) agent.togglePanel()
  useSheetsStore.getState().closePalette()
  void agent
    .sendPrompt(text)
    .catch((cause: unknown) =>
      useNoticeStore.getState().say(cause instanceof Error ? cause.message : String(cause)),
    )
}

/** ⌘K palette per Washi.dc.html: scrim, 560px panel at 14vh, ask Washi, a blank page, pages. */
export function CommandPalette() {
  const { sheets, paletteOpen, closePalette, createSheet, searchTerm, searchHits, search } =
    useSheetsStore()
  const ref = usePalette(paletteOpen)
  const question = searchTerm.trim()

  if (!paletteOpen) return null

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label="Ask Washi or search"
      tabIndex={-1}
      className="fixed inset-0 z-50 outline-none"
    >
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
            onKeyDown={(event) => {
              if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey) || !question) return
              event.preventDefault()
              askWashi(question)
            }}
            placeholder="Ask Washi or search pages…"
            className="h-11 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground pointer-coarse:hidden">
            esc
          </kbd>
        </div>
        <Command.List className="max-h-[320px] overflow-y-auto p-1.5">
          <Command.Empty className="px-3 py-6 text-center text-[13px] text-muted-foreground">
            No pages match that.
          </Command.Empty>
          {question && (
            <Command.Item
              forceMount
              value="ask washi"
              onSelect={() => askWashi(question)}
              className="flex h-9 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-[13px] data-[selected=true]:bg-accent"
            >
              <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-agent font-semibold text-[9px] text-white">
                AI
              </span>
              <span className="min-w-0 truncate">
                Ask Washi: <span className="font-medium">{question}</span>
              </span>
              <kbd className="ml-auto shrink-0 rounded border border-border bg-muted px-1 font-mono text-[10px] text-muted-foreground pointer-coarse:hidden">
                ⌘⏎
              </kbd>
            </Command.Item>
          )}
          <Command.Group
            heading="Create"
            className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.06em]"
          >
            <Command.Item
              value="new blank page create"
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
          {searchHits.length > 0 && (
            <Command.Group
              heading="Inside pages"
              className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.06em]"
            >
              {searchHits.map((hit) => (
                <Command.Item
                  key={`hit:${hit.id}`}
                  // cmdk filters on value; the term is in it, so a body match is never filtered out.
                  value={`${searchTerm} ${hit.title} ${hit.id} body`}
                  onSelect={() => {
                    useViewStore.getState().openTab(`note:${hit.id}`)
                    closePalette()
                  }}
                  className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 text-[13px] data-[selected=true]:bg-accent"
                >
                  <SheetIcon name={hit.icon} className="mt-0.5 size-4 text-muted-foreground" />
                  <span className="min-w-0">
                    <span className="block truncate">{hit.title}</span>
                    <span className="block truncate text-[12px] text-muted-foreground">
                      {hit.snippet}
                    </span>
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      </Command>
    </div>
  )
}
