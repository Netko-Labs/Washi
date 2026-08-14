import { IconArrowUp, IconChevronDown, IconPlus, IconX } from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'
import { AgentMascot } from '@/components/mascot/AgentMascot'
import { mascotStateFor, useAgentStore } from '@/stores/agent/agent-store'
import { useSheetsStore } from '@/stores/sheets/sheets-store'
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

const SUGGESTIONS = ['Summarize this page', 'Find contradictions']

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
  } = useAgentStore()
  const { sheets, activeId } = useSheetsStore()
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void init()
  }, [init])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [transcript.length])

  const activeSheet = sheets.find((sheet) => sheet.id === activeId)
  const mascotState = mascotStateFor(transcript, running, approvals)

  const submit = (text?: string) => {
    const prompt = text ?? draft
    if (!prompt.trim() || running) return
    void sendPrompt(prompt)
    setDraft('')
  }

  return (
    <aside
      className="flex w-[334px] shrink-0 flex-col border-border border-l bg-card"
      data-agent-panel
    >
      <div className="flex h-12 shrink-0 items-center gap-2.5 border-border border-b pr-3 pl-3.5">
        <AgentMascot state={mascotState} size={26} />
        <div className="min-w-0 flex-1">
          <div className="font-medium text-[13px]">Washi</div>
          <div className="truncate text-[11px] text-muted-foreground">
            {running ? `editing ${activeSheet?.title ?? 'a page'}` : 'watching this vault'}
          </div>
        </div>
        <select
          value={activeSessionId ?? ''}
          onChange={(event) => void selectSession(event.target.value)}
          aria-label="Agent session"
          className="h-6 max-w-24 rounded-md border border-border bg-background px-1 text-[11px] outline-none"
        >
          {sessions.length === 0 && <option value="">—</option>}
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-label="New session"
          onClick={() => void createSession()}
          className="grid size-[26px] shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <IconPlus className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label="Close agent panel"
          onClick={togglePanel}
          className="grid size-[26px] shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <IconX className="size-3.5" />
        </button>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <TranscriptView transcript={transcript} />
        {running && (
          <div className="flex items-center gap-2 px-4 pb-3 text-[12px] text-muted-foreground">
            <AgentMascot state="writing" size={20} />
            Washi is working…
          </div>
        )}
      </div>

      <ApprovalBar />

      <div className="px-3 pb-3">
        {transcript.length === 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => submit(suggestion)}
                className="h-[26px] rounded-full bg-muted px-3 text-[12px] text-muted-foreground hover:text-foreground"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        <div className="rounded-2xl border border-border bg-background px-3 pt-2.5 pb-2 shadow-[0_1px_3px_rgb(0_0_0/0.05)]">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                submit()
              }
            }}
            placeholder="Ask, or tell Washi what to write…"
            rows={2}
            className="w-full resize-none bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              aria-label="Attach"
              className="grid size-[26px] place-items-center rounded-full border border-border text-muted-foreground hover:bg-accent"
            >
              <IconPlus className="size-3.5" />
            </button>
            <button
              type="button"
              className="flex h-[26px] items-center gap-1 rounded-lg px-1.5 text-[12px] text-muted-foreground hover:bg-accent"
            >
              Sonnet 4.5
              <IconChevronDown className="size-3" />
            </button>
            <div
              className="ml-auto h-1 w-11 overflow-hidden rounded-full bg-muted"
              title="32k / 200k"
            >
              <div className="h-full w-[16%] rounded-full bg-agent" />
            </div>
            <button
              type="button"
              aria-label="Send"
              disabled={running || !draft.trim()}
              onClick={() => submit()}
              className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
            >
              <IconArrowUp className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
