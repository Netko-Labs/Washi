import {
  IconCheck,
  IconChevronDown,
  IconEraser,
  IconMaximize,
  IconMinimize,
  IconPlus,
  IconX,
} from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'
import { AgentMascot } from '@/components/mascot/AgentMascot'
import { mascotStateFor, useAgentStore } from '@/stores/agent/agent-store'
import { useSheetsStore } from '@/stores/sheets/sheets-store'
import { useViewStore } from '@/stores/view/view-store'
import { AgentComposer } from './AgentComposer'
import { TranscriptView } from './TranscriptView'

function ApprovalBar() {
  const approvals = useAgentStore((state) => state.approvals)
  const resolveApproval = useAgentStore((state) => state.resolveApproval)
  const next = approvals[0]
  if (!next) return null

  return (
    <div className="mx-3 mb-2 overflow-hidden rounded-xl border border-agent" data-approval-bar>
      <div className="flex items-center gap-2 border-border border-b bg-muted px-3 py-2 text-[12px]">
        <AgentMascot state="suggesting" size={18} />
        <span className="font-medium">Washi asks to run</span>
        <span className="truncate font-mono text-muted-foreground">{next.toolName}</span>
        {approvals.length > 1 && (
          <span className="text-muted-foreground">+{approvals.length - 1}</span>
        )}
      </div>
      <pre className="max-h-24 overflow-auto px-3 py-2 text-[11px] text-muted-foreground">
        {JSON.stringify(next.input, null, 2)}
      </pre>
      <div className="flex justify-end gap-1.5 px-3 pb-2.5">
        <button
          type="button"
          onClick={() => void resolveApproval(next.id, 'reject_once')}
          className="h-[26px] rounded-lg border border-border bg-background px-2.5 text-[12px] hover:bg-accent"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={() => void resolveApproval(next.id, 'allow_always')}
          className="h-[26px] rounded-lg border border-border bg-background px-2.5 text-[12px] hover:bg-accent"
        >
          Always
        </button>
        <button
          type="button"
          onClick={() => void resolveApproval(next.id, 'allow_once')}
          className="h-[26px] rounded-lg bg-primary px-2.5 font-medium text-[12px] text-primary-foreground"
        >
          Accept
        </button>
      </div>
    </div>
  )
}

function EmptyChat({ onStarter }: { onStarter: (text: string) => void }) {
  const identity = useViewStore((state) => state.identity)
  const { sheets, activeId } = useSheetsStore()
  const leaf = sheets.find((sheet) => sheet.id === activeId)?.title ?? 'this vault'
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

export function AgentPanel() {
  const {
    sessions,
    activeSessionId,
    transcript,
    approvals,
    running,
    init,
    createSession,
    selectSession,
    sendPrompt,
    togglePanel,
    chatExpanded,
    toggleExpanded,
  } = useAgentStore()
  const { sheets, activeId } = useSheetsStore()
  const [convosOpen, setConvosOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void init()
  }, [init])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [transcript.length])

  const activeSheet = sheets.find((sheet) => sheet.id === activeId)
  const mascotState = mascotStateFor(transcript, running, approvals)
  const activeSession = sessions.find((session) => session.id === activeSessionId)

  const submit = (text: string) => {
    if (!running) void sendPrompt(text)
  }

  return (
    <>
      {chatExpanded && (
        <button
          type="button"
          aria-label="Collapse chat"
          onClick={toggleExpanded}
          className="fixed inset-0 z-[49] cursor-default bg-black/40"
        />
      )}
      <aside
        data-agent-panel
        className={`fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_64px_rgb(0_0_0/0.22),0_4px_16px_rgb(0_0_0/0.10)] ${
          chatExpanded
            ? 'inset-0 m-auto h-[min(680px,calc(100vh-80px))] w-[min(720px,calc(100vw-80px))]'
            : 'right-6 bottom-[92px] h-[min(620px,calc(100vh-130px))] w-[400px]'
        }`}
      >
        <div className="relative flex h-[50px] shrink-0 items-center gap-0.5 border-border border-b pr-2 pl-3.5">
          <AgentMascot state={mascotState} size={26} />
          <button
            type="button"
            onClick={() => setConvosOpen((open) => !open)}
            className="-ml-1 flex h-[34px] items-center gap-1.5 rounded-[9px] px-2 text-left hover:bg-accent"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium text-[13px]">
                {activeSession?.title ?? 'Washi'}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {running ? `editing ${activeSheet?.title ?? 'a page'}` : 'watching this vault'}
              </span>
            </span>
            <IconChevronDown className="size-[13px] shrink-0 text-muted-foreground" />
          </button>
          <div className="ml-auto flex gap-0.5">
            <button
              type="button"
              aria-label="Clear conversation"
              title="Clear conversation"
              onClick={() => void createSession()}
              className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <IconEraser className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label={chatExpanded ? 'Collapse' : 'Expand'}
              title={chatExpanded ? 'Collapse' : 'Expand'}
              onClick={toggleExpanded}
              className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {chatExpanded ? (
                <IconMinimize className="size-3.5" />
              ) : (
                <IconMaximize className="size-3.5" />
              )}
            </button>
            <button
              type="button"
              aria-label="Close agent panel"
              onClick={togglePanel}
              className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <IconX className="size-[15px]" />
            </button>
          </div>

          {convosOpen && (
            <div className="absolute top-12 left-3 z-[60] w-[264px] rounded-xl border border-border bg-popover p-[5px] shadow-[0_8px_28px_rgb(0_0_0/0.16)]">
              <div className="px-2 pt-1.5 pb-1 font-semibold text-[10.5px] text-muted-foreground uppercase tracking-[0.06em]">
                Conversations
              </div>
              {sessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => {
                    void selectSession(session.id)
                    setConvosOpen(false)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-[7px] text-left text-[12.5px] hover:bg-accent"
                >
                  <span className="min-w-0 flex-1 truncate font-medium">{session.title}</span>
                  {session.id === activeSessionId && <IconCheck className="size-[13px]" />}
                </button>
              ))}
              <div className="mx-1 my-1 h-px bg-border" />
              <button
                type="button"
                onClick={() => {
                  void createSession()
                  setConvosOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-[7px] text-left text-[12.5px] text-muted-foreground hover:bg-accent"
              >
                <IconPlus className="size-[13px]" />
                New conversation
              </button>
            </div>
          )}
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          {transcript.length === 0 && !running ? (
            <EmptyChat onStarter={(text) => submit(text)} />
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
    </>
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
      className="fixed right-6 bottom-6 z-[48] grid size-[52px] place-items-center rounded-full border border-border bg-card shadow-[0_8px_28px_rgb(0_0_0/0.18)] hover:shadow-[0_12px_34px_rgb(0_0_0/0.24)]"
    >
      <AgentMascot state={mascotStateFor(transcript, running, approvals)} size={36} />
    </button>
  )
}
