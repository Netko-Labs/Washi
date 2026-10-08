import { IconPlayerStopFilled, IconRefresh, IconSend, IconX } from '@tabler/icons-react'
import { useState } from 'react'
import { ApprovalPrompt } from './approval-prompt'
import { useAgent } from './lib'
import { Transcript } from './transcript'

/**
 * Full-height sheet on a phone, a docked column above it. The page keeps its
 * own canvas either way — the panel never frames it.
 */
export function AgentPanel({
  workspaceId,
  onClose,
  onSheetsChanged,
}: {
  workspaceId: string
  onClose: () => void
  onSheetsChanged: () => void
}) {
  const { transcript, approvals, running, error, send, stop, decide, reset } = useAgent(
    workspaceId,
    onSheetsChanged,
  )
  const [draft, setDraft] = useState('')

  const submit = () => {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    void send(text)
  }

  return (
    <aside className="fixed inset-0 z-50 flex flex-col border-border bg-card md:static md:z-auto md:w-[380px] md:shrink-0 md:border-l">
      <header className="flex h-14 shrink-0 items-center gap-2 border-border border-b px-3">
        <span className="flex-1 font-bold text-[14px]">
          Washi {running && <span className="text-muted-foreground">· thinking</span>}
        </span>
        <button
          type="button"
          onClick={() => void reset()}
          aria-label="New conversation"
          className="grid size-11 place-items-center rounded-lg hover:bg-accent"
        >
          <IconRefresh className="size-4" />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Washi"
          className="grid size-11 place-items-center rounded-lg hover:bg-accent"
        >
          <IconX className="size-5" />
        </button>
      </header>

      <Transcript entries={transcript} />

      {error && <p className="px-4 pb-2 text-[12.5px] text-destructive">{error}</p>}

      {approvals.map((approval) => (
        <ApprovalPrompt key={approval.id} approval={approval} onDecide={decide} />
      ))}

      <form
        className="flex shrink-0 items-end gap-2 border-border border-t p-3"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <textarea
          value={draft}
          rows={1}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              submit()
            }
          }}
          placeholder="Ask for a page…"
          className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus-visible:border-primary"
        />
        {running ? (
          <button
            type="button"
            onClick={() => void stop()}
            aria-label="Stop"
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-foreground text-background"
          >
            <IconPlayerStopFilled className="size-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Send"
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40"
          >
            <IconSend className="size-4" />
          </button>
        )}
      </form>
    </aside>
  )
}
