import {
  IconArrowsDiagonal,
  IconChevronDown,
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
  IconPlus,
  IconX,
} from '@tabler/icons-react'
import { useState } from 'react'
import { AgentMascot } from '../mascot'
import { mascotStateFor, useAgentStore } from '../stores'
import { AgentComposer } from './agent-composer'
import { ApprovalBar } from './approval-bar'
import { ConversationsMenu } from './conversations-menu'
import { EmptyChat } from './empty-chat'
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
