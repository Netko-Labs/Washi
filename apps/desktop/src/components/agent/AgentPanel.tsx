import { IconPlus, IconSend } from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'
import { useAgentStore } from '@/stores/agent/agent-store'
import { TranscriptView } from './TranscriptView'

function ApprovalBar() {
  const approvals = useAgentStore((state) => state.approvals)
  const resolveApproval = useAgentStore((state) => state.resolveApproval)
  const next = approvals[0]
  if (!next) return null

  return (
    <div className="border-border border-t bg-muted/60 px-3 py-2" data-approval-bar>
      <div className="mb-1.5 text-xs">
        <span className="font-medium">approval needed:</span>{' '}
        <span className="font-mono">{next.toolName}</span>
        {approvals.length > 1 && (
          <span className="text-muted-foreground"> (+{approvals.length - 1} more)</span>
        )}
      </div>
      <pre className="mb-2 max-h-24 overflow-auto rounded bg-muted p-1.5 text-xs">
        {JSON.stringify(next.input, null, 2)}
      </pre>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => void resolveApproval(next.id, 'allow_once')}
          className="rounded-md bg-primary px-2.5 py-1 font-medium text-primary-foreground text-xs"
        >
          Allow once
        </button>
        <button
          type="button"
          onClick={() => void resolveApproval(next.id, 'allow_always')}
          className="rounded-md border border-border px-2.5 py-1 font-medium text-xs hover:bg-accent"
        >
          Always allow
        </button>
        <button
          type="button"
          onClick={() => void resolveApproval(next.id, 'reject_once')}
          className="ml-auto rounded-md border border-destructive/40 px-2.5 py-1 font-medium text-destructive text-xs hover:bg-destructive/10"
        >
          Reject
        </button>
      </div>
    </div>
  )
}

export function AgentPanel() {
  const {
    sessions,
    activeSessionId,
    transcript,
    running,
    init,
    createSession,
    selectSession,
    sendPrompt,
  } = useAgentStore()
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void init()
  }, [init])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [transcript.length])

  const submit = () => {
    if (!draft.trim() || running) return
    void sendPrompt(draft)
    setDraft('')
  }

  return (
    <aside
      className="flex w-96 shrink-0 flex-col border-border border-l bg-muted/20"
      data-agent-panel
    >
      <div className="flex items-center gap-1 border-border border-b px-2 py-1.5">
        <select
          value={activeSessionId ?? ''}
          onChange={(event) => void selectSession(event.target.value)}
          aria-label="Agent session"
          className="h-7 min-w-0 flex-1 rounded-md border border-input bg-background px-1.5 text-xs outline-none"
        >
          {sessions.length === 0 && <option value="">no sessions yet</option>}
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.title} · ${session.costUsd.toFixed(2)}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-label="New session"
          title="New session"
          onClick={() => void createSession()}
          className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <IconPlus className="size-4" />
        </button>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <TranscriptView transcript={transcript} />
      </div>

      <ApprovalBar />

      <div className="border-border border-t p-2">
        <div className="flex items-end gap-1.5">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                submit()
              }
            }}
            placeholder={running ? 'agent is working…' : 'Ask the agent'}
            rows={2}
            className="min-h-0 flex-1 resize-none rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            type="button"
            aria-label="Send"
            disabled={running || !draft.trim()}
            onClick={submit}
            className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground disabled:opacity-40"
          >
            <IconSend className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
