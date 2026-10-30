import { useShallow } from 'zustand/react/shallow'
import { mascotStateFor, turnViewOf, useAgentStore } from '../stores'
import { AgentComposer } from './agent-composer'
import { ApprovalBar } from './approval-bar'
import { EmptyChat } from './empty-chat'
import { type AgentPanelProps, usePanelFrame } from './lib'
import { MovedNote } from './moved-note'
import { PanelHeader } from './panel-header'
import { TranscriptView } from './transcript-view'
import { TurnStatus } from './turn-status'

const FRAME = {
  float:
    'fixed inset-x-3 bottom-[84px] z-50 h-[min(620px,calc(100dvh-110px))] rounded-2xl border border-border shadow-[0_24px_64px_rgb(0_0_0/0.22),0_4px_16px_rgb(0_0_0/0.10)] sm:inset-x-auto sm:right-6 sm:bottom-[92px] sm:h-[min(620px,calc(100dvh-130px))] sm:w-[400px]',
  dock: 'relative z-20 h-full w-[420px] shrink-0 border-border border-l',
  sheet:
    'fixed inset-0 z-50 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]',
  page: 'h-full min-h-0 w-full',
}

/** The door's room: a popover, a dock beside the page, or the whole screen on a phone (D61). */
export function AgentPanel({ placement = 'float', onExpand }: AgentPanelProps) {
  const { title, transcript, mood, isEmpty, turn } = useAgentStore(
    useShallow((state) => ({
      title: state.sessions.find((session) => session.id === state.activeSessionId)?.title,
      transcript: state.transcript,
      mood: mascotStateFor(state.transcript, state.running, state.approvals, state.stalled),
      isEmpty: state.transcript.length === 0 && !state.running,
      turn: turnViewOf(state).state,
    })),
  )
  const { scrollRef } = usePanelFrame(transcript.length, turn)
  const store = useAgentStore.getState

  return (
    <aside
      data-agent-panel
      data-placement={placement}
      className={`flex flex-col overflow-hidden bg-card ${FRAME[placement]}`}
    >
      <PanelHeader
        placement={placement}
        onExpand={onExpand}
        title={title ?? 'Washi'}
        mascotState={mood}
      />

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-y-none">
        {isEmpty ? (
          <EmptyChat onStarter={(text) => void store().sendPrompt(text)} />
        ) : (
          <TranscriptView transcript={transcript} />
        )}
        <TurnStatus variant="panel" />
      </div>

      <ApprovalBar />

      <AgentComposer />
      <MovedNote />
    </aside>
  )
}
