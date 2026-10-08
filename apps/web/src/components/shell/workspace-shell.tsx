import {
  IconChevronLeft,
  IconMenu2,
  IconPlus,
  IconSettings,
  IconSparkles,
  IconX,
} from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import { AgentPanel } from '@/components/agent'
import { AgentStatus } from '@/components/agent-status'
import { FirstRunGate } from '@/components/first-run'
import { SettingsScreen } from '@/components/settings'
import { SheetView } from '@/components/sheet'
import { createPaperHost } from '@/lib/paper-host'
import { api } from '@/lib/rpc'
import type { WorkspaceSummary } from '@/lib/types'
import { useWorkspaceSheets } from './lib'
import { SheetList } from './sheet-list'

/**
 * The web shell. None of the desktop's chrome is shared — its 248px sidebar and
 * 334px panel are fixed by design — so this is its own layout: a drawer under
 * `md`, two columns above it. The page canvas itself is identical, because
 * @washi/paper sizes to its container rather than the window (Q16).
 */
export function WorkspaceShell({
  workspace,
  onLeave,
}: {
  workspace: WorkspaceSummary
  onLeave: () => void
}) {
  const { sheets, activeId, setActiveId, error, loading, refresh } = useWorkspaceSheets(
    workspace.id,
  )
  const [navOpen, setNavOpen] = useState(false)
  const [agentOpen, setAgentOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const host = useMemo(
    () =>
      createPaperHost((id) => {
        setActiveId(id)
        setNavOpen(false)
      }),
    [setActiveId],
  )

  const select = (id: string) => {
    setActiveId(id)
    setNavOpen(false)
  }

  // A blank page for the agent to design into. The bet is edit-by-asking, so
  // this creates the canvas and the asking happens in the panel.
  const newPage = async () => {
    const sheet = await api.sheets.create.mutate({
      write: {
        title: 'Untitled',
        source: '<Sheet title="Untitled" class="min-h-full px-6 py-12" />\n',
      },
    })
    await refresh()
    select(sheet.id)
    setAgentOpen(true)
  }

  return (
    <div className="flex h-dvh flex-col md:flex-row">
      <header className="flex h-14 shrink-0 items-center gap-2 border-border border-b px-3 md:hidden">
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          aria-label="Open page list"
          className="grid size-11 place-items-center rounded-lg hover:bg-accent"
        >
          <IconMenu2 className="size-5" />
        </button>
        <span className="min-w-0 flex-1 truncate font-bold text-[14px]">{workspace.name}</span>
        <button
          type="button"
          onClick={() => setAgentOpen(true)}
          aria-label="Ask Washi"
          className="grid size-11 place-items-center rounded-lg hover:bg-accent"
        >
          <IconSparkles className="size-5" />
        </button>
      </header>

      {navOpen && (
        <button
          type="button"
          aria-label="Close page list"
          tabIndex={-1}
          className="fixed inset-0 z-40 cursor-default bg-black/40 md:hidden"
          onClick={() => setNavOpen(false)}
        />
      )}

      <nav
        className={`z-50 flex w-72 shrink-0 flex-col border-border bg-card md:relative md:flex md:translate-x-0 md:border-r ${
          navOpen
            ? 'fixed inset-y-0 left-0 translate-x-0'
            : 'fixed inset-y-0 left-0 -translate-x-full md:static'
        } transition-transform md:transition-none`}
      >
        <div className="flex h-14 shrink-0 items-center gap-2 px-3">
          <button
            type="button"
            onClick={onLeave}
            className="grid size-11 shrink-0 place-items-center rounded-lg hover:bg-accent"
            aria-label="All workspaces"
          >
            <IconChevronLeft className="size-5" />
          </button>
          <span className="min-w-0 flex-1 truncate font-bold text-[14px]">{workspace.name}</span>
          <button
            type="button"
            onClick={() => setNavOpen(false)}
            aria-label="Close page list"
            className="grid size-11 shrink-0 place-items-center rounded-lg hover:bg-accent md:hidden"
          >
            <IconX className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          <p className="px-2.5 py-2 font-bold text-[11px] text-muted-foreground tracking-[0.12em] uppercase">
            Pages
          </p>
          {loading && <p className="px-2.5 text-[13px] text-muted-foreground">Loading…</p>}
          {error && <p className="px-2.5 text-[13px] text-destructive">{error}</p>}
          {!loading && !error && sheets.length === 0 && (
            <p className="px-2.5 text-[13px] text-muted-foreground leading-relaxed">
              No pages yet. Washi writes them — there is nothing to type into here.
            </p>
          )}
          <SheetList sheets={sheets} activeId={activeId} onSelect={select} />
        </div>

        <div className="shrink-0 border-border border-t p-2">
          <AgentStatus
            onOpenAgent={() => {
              setAgentOpen(true)
              setNavOpen(false)
            }}
            onOpenSettings={() => {
              setSettingsOpen(true)
              setNavOpen(false)
            }}
          />
          <button
            type="button"
            onClick={() => void newPage()}
            className="flex h-11 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[13.5px] hover:bg-accent"
          >
            <IconPlus className="size-4" />
            New page
          </button>
          <button
            type="button"
            onClick={() => {
              setSettingsOpen(true)
              setNavOpen(false)
            }}
            className="flex h-11 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[13.5px] hover:bg-accent"
          >
            <IconSettings className="size-4" />
            Settings
          </button>
        </div>
      </nav>

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        {settingsOpen ? (
          <SettingsScreen workspaceId={workspace.id} onClose={() => setSettingsOpen(false)} />
        ) : (
          <FirstRunGate workspace={workspace}>
            <SheetView id={activeId} host={host} />
          </FirstRunGate>
        )}
      </main>

      {!agentOpen && (
        <button
          type="button"
          onClick={() => setAgentOpen(true)}
          aria-label="Ask Washi"
          className="fixed right-5 bottom-5 hidden size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg md:grid"
        >
          <IconSparkles className="size-5" />
        </button>
      )}

      {agentOpen && (
        <AgentPanel
          workspaceId={workspace.id}
          onClose={() => setAgentOpen(false)}
          onSheetsChanged={() => void refresh()}
          onOpenSheet={(id) => {
            setSettingsOpen(false)
            setActiveId(id)
          }}
        />
      )}
    </div>
  )
}
