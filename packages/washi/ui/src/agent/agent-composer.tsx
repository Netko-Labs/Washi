import {
  IconArrowUp,
  IconFile,
  IconFileText,
  IconPlayerStopFilled,
  IconPlus,
  IconX,
} from '@tabler/icons-react'
import { useAgentStore } from '../stores'
import { AttachMenu } from './attach-menu'
import { useComposer, useComposerSession, useInference } from './lib'
import { OptionChips } from './option-chips'

/** The door's keyboard: what rides with the ask, what thinks about it, Send that becomes Stop. */
export function AgentComposer() {
  const composer = useComposer()
  const inference = useInference()
  const { attachOpen, setAttachOpen } = composer
  const { running, session } = useComposerSession()

  return (
    <div className="px-3 pb-3">
      <div className="rounded-2xl border border-border bg-background px-3 pt-2.5 pb-2 shadow-[0_1px_3px_rgb(0_0_0/0.05)]">
        {composer.attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {composer.attachments.map((ref) => (
              <span
                key={ref.id}
                className="flex h-[26px] items-center gap-1.5 rounded-lg bg-muted pr-1 pl-2 text-[11.5px]"
              >
                {ref.kind === 'page' ? (
                  <IconFileText className="size-3.5 text-muted-foreground" />
                ) : (
                  <IconFile className="size-3.5 text-muted-foreground" />
                )}
                <span className="max-w-[160px] truncate font-medium">{ref.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${ref.name}`}
                  onClick={() => composer.detach(ref.id)}
                  className="grid size-5 place-items-center rounded text-muted-foreground hover:text-foreground"
                >
                  <IconX className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <textarea
          value={composer.draft}
          onChange={(event) => composer.setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              composer.submit()
            }
          }}
          placeholder="Ask, or tell Washi what to write…"
          rows={2}
          className="w-full resize-none bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
        />
        {composer.error && <p className="pb-1 text-[11.5px] text-destructive">{composer.error}</p>}
        <div className="flex items-center gap-1.5 pt-1">
          <div className="relative">
            <button
              type="button"
              aria-label="Attach"
              aria-expanded={attachOpen}
              onClick={() => setAttachOpen((open) => !open)}
              disabled={composer.uploading}
              className={`grid size-[26px] place-items-center rounded-full border border-border text-muted-foreground hover:bg-accent ${attachOpen ? 'bg-accent' : ''} disabled:opacity-50`}
            >
              <IconPlus className={`size-3.5 ${composer.uploading ? 'animate-pulse' : ''}`} />
            </button>
            {attachOpen && (
              <AttachMenu
                canUpload={composer.canUpload}
                onPage={composer.attach}
                onFile={(file) => void composer.attachFile(file)}
                onClose={() => setAttachOpen(false)}
              />
            )}
          </div>
          <OptionChips session={session} inference={inference} />
          {running ? (
            <button
              type="button"
              aria-label="Stop"
              onClick={() => void useAgentStore.getState().stopTurn()}
              className="ml-auto grid size-7 shrink-0 place-items-center rounded-full bg-foreground text-background"
            >
              <IconPlayerStopFilled className="size-3.5" />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Send"
              disabled={!composer.draft.trim() || composer.uploading}
              onClick={composer.submit}
              className="ml-auto grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
            >
              <IconArrowUp className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
