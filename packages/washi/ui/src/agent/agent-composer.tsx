import { IconArrowUp, IconPlayerStopFilled, IconPlus } from '@tabler/icons-react'
import { useState } from 'react'
import { AutoApproveChip } from '../approval'
import { useAgentStore } from '../stores'
import { useInferenceLabel } from './lib'

/** While a turn runs, Send becomes Stop: an agent you cannot interrupt is not one you trust. */
export function AgentComposer() {
  const { running, sendPrompt, stopTurn } = useAgentStore()
  const [draft, setDraft] = useState('')
  const label = useInferenceLabel()

  const submit = () => {
    if (!draft.trim() || running) return
    void sendPrompt(draft)
    setDraft('')
  }

  return (
    <div className="px-3 pb-3">
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
          <AutoApproveChip />
          {label && (
            <span className="truncate font-mono text-[11px] text-muted-foreground" data-inference>
              {label}
            </span>
          )}
          {running ? (
            <button
              type="button"
              aria-label="Stop"
              onClick={() => void stopTurn()}
              className="ml-auto grid size-7 place-items-center rounded-full bg-foreground text-background"
            >
              <IconPlayerStopFilled className="size-3.5" />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Send"
              disabled={!draft.trim()}
              onClick={submit}
              className="ml-auto grid size-7 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
            >
              <IconArrowUp className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
