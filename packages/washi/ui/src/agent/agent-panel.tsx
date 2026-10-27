import {
  IconArrowsDiagonal,
  IconChevronDown,
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
  IconPlus,
  IconX,
} from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { ApprovalCard } from '../approval'
import { AgentMascot } from '../mascot'
import { mascotStateFor, noteIdOf, useAgentStore, useSheetsStore, useViewStore } from '../stores'
import { AgentComposer } from './agent-composer'
import { ConversationsMenu } from './conversations-menu'
import { type AgentPanelProps, usePanelFrame } from './lib'
import { TranscriptView } from './transcript-view'

const FRAME = {
  float:
    'fixed inset-x-3 bottom-[84px] z-50 h-[min(620px,calc(100dvh-110px))] rounded-2xl border border-border shadow-[0_24px_64px_rgb(0_0_0/0.22),0_4px_16px_rgb(0_0_0/0.10)] sm:inset-x-auto sm:right-6 sm:bottom-[92px] sm:h-[min(620px,calc(100dvh-130px))] sm:w-[400px]',
  dock: 'relative z-20 h-full w-[420px] shrink-0 border-border border-l',
  sheet: 'fixed inset-0 z-50',
  page: 'h-full min-h-0 w-full',
}

const HEADER_BUTTON =
  'grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground'

function ApprovalBar() {
  const approvals = useAgentStore((state) => state.approvals)
  const next = approvals[0]
  if (!next) return null

  return (
    <div className="mx-3 mb-2" data-approval-bar>
      <ApprovalCard
        key={next.id}
        toolName={next.toolName}
        input={next.input}
        more={approvals.length - 1}
        onDecide={(decision) => useAgentStore.getState().resolveApproval(next.id, decision)}
      />
    </div>
  )
}

function EmptyChat({ onStarter }: { onStarter: (text: string) => void }) {
  const identity = useViewStore((state) => state.identity)
  const sheets = useSheetsStore((state) => state.sheets)
  const pageId = useViewStore((state) => noteIdOf(state.activeTab))
  const leaf = sheets.find((sheet) => sheet.id === pageId)?.title ?? 'this workspace'
  const firstName = identity.name.trim().split(/\s+/)[0] || 'there'

  const starters = [
    `Summarize ${leaf}`,
    'Find contradictions with other pages',
    'Tighten the intro paragraph',
  ]

  return (
    <div className="flex flex-col gap-3 px-4 pt-[18px] pb-2">
      <AgentMascot state="idle" size={52} />
      <div className="font-semibold text-[15px] tracking-[-0.01em]">Hi {firstName}</div>
      <p className="text-[12.5px] text-muted-foreground leading-relaxed">
        I'm watching {leaf}. Ask me anything, or start from one of these:
      </p>
      {starters.map((starter) => (
        <button
          key={starter}
          type="button"
          onClick={() => onStarter(starter)}
          className="w-full rounded-[11px] border border-border bg-background px-[11px] py-[9px] text-left text-[12.5px] hover:bg-accent"
        >
          {starter}
        </button>
      ))}
      <div className="text-[11px] text-muted-foreground">
        Toggle anytime with{' '}
        <span className="inline-flex h-[18px] items-center rounded-[5px] border border-border bg-muted px-[5px] font-mono text-[10.5px]">
          ⌘J
        </span>
      </div>
    </div>
  )
}

/** The door's room: a popover, a dock beside the page, or the whole screen on a phone (D61). */
export function AgentPanel({ placement = 'float', onExpand }: AgentPanelProps) {
  const { sessions, activeSessionId, transcript, approvals, running } = useAgentStore()
  const [convosOpen, setConvosOpen] = useState(false)
  const { scrollRef, activeSheetTitle } = usePanelFrame(transcript.length)
  const store = useAgentStore.getState

  const mascotState = mascotStateFor(transcript, running, approvals)
  const activeSession = sessions.find((session) => session.id === activeSessionId)

  return (
    <aside
      data-agent-panel
      data-placement={placement}
      className={`flex flex-col overflow-hidden bg-card ${FRAME[placement]}`}
    >
      <div className="relative flex h-[50px] shrink-0 items-center gap-0.5 border-border border-b pr-2 pl-3.5">
        <AgentMascot state={mascotState} size={26} />
        <button
          type="button"
          onClick={() => setConvosOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={convosOpen}
          className="-ml-1 flex h-[34px] min-w-0 items-center gap-1.5 rounded-[9px] px-2 text-left hover:bg-accent"
        >
          <span className="min-w-0">
            <span className="block truncate font-medium text-[13px]">
              {activeSession?.title ?? 'Washi'}
            </span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {running ? `editing ${activeSheetTitle ?? 'a page'}` : 'watching this workspace'}
            </span>
          </span>
          <IconChevronDown className="size-[13px] shrink-0 text-muted-foreground" />
        </button>
        <div className="ml-auto flex gap-0.5">
          <button
            type="button"
            aria-label="New conversation"
            title="New conversation"
            onClick={() => void store().createSession()}
            className={HEADER_BUTTON}
          >
            <IconPlus className="size-[15px]" />
          </button>
          {onExpand && placement !== 'page' && (
            <button
              type="button"
              aria-label="Open the chat as a page"
              title="Open as a page"
              onClick={onExpand}
              className={HEADER_BUTTON}
            >
              <IconArrowsDiagonal className="size-[15px]" />
            </button>
          )}
          {(placement === 'float' || placement === 'dock') && (
            <button
              type="button"
              aria-label={
                placement === 'dock' ? 'Float the panel' : 'Dock the panel beside the page'
              }
              title={placement === 'dock' ? 'Float' : 'Dock to the side'}
              onClick={() => store().toggleDocked()}
              className={HEADER_BUTTON}
            >
              {placement === 'dock' ? (
                <IconLayoutSidebarRightCollapse className="size-[15px]" />
              ) : (
                <IconLayoutSidebarRightExpand className="size-[15px]" />
              )}
            </button>
          )}
          {placement !== 'page' && (
            <button
              type="button"
              aria-label="Close agent panel"
              onClick={() => store().togglePanel()}
              className={HEADER_BUTTON}
            >
              <IconX className="size-[15px]" />
            </button>
          )}
        </div>
        {convosOpen && <ConversationsMenu onClose={() => setConvosOpen(false)} />}
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-y-none">
        {transcript.length === 0 && !running ? (
          <EmptyChat onStarter={(text) => void store().sendPrompt(text)} />
        ) : (
          <TranscriptView transcript={transcript} />
        )}
        {running && (
          <div className="flex items-center gap-2 px-4 pb-3 text-[12px] text-muted-foreground">
            <AgentMascot state="writing" size={20} />
            Washi is working…
          </div>
        )}
      </div>

      <ApprovalBar />

      <AgentComposer />
    </aside>
  )
}

/** The 52px mascot FAB; ⌘J and this button toggle the popover. */
export function AgentFab() {
  const togglePanel = useAgentStore((state) => state.togglePanel)
  const transcript = useAgentStore((state) => state.transcript)
  const running = useAgentStore((state) => state.running)
  const approvals = useAgentStore((state) => state.approvals)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'j' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        togglePanel()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [togglePanel])

  return (
    <button
      type="button"
      data-agent-fab
      aria-label="Ask Washi (⌘J)"
      title="Ask Washi (⌘J)"
      onClick={togglePanel}
      className="fixed right-6 bottom-6 z-[48] size-[52px] overflow-hidden rounded-full border-2 border-card bg-[#DF8552] shadow-[0_8px_28px_rgb(0_0_0/0.18)] transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-[0_12px_34px_rgb(0_0_0/0.24)]"
    >
      <AgentMascot state={mascotStateFor(transcript, running, approvals)} size={48} crop />
    </button>
  )
}
