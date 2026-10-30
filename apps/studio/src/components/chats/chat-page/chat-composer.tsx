import {
  IconArrowUp,
  IconFile,
  IconFileText,
  IconPlayerStopFilled,
  IconPlus,
  IconX,
} from '@tabler/icons-react'
import {
  AttachMenu,
  AutosizeTextarea,
  OptionChips,
  useAgentStore,
  useComposerSession,
  useInference,
  YoloNote,
} from '@washi/ui'
import type { ChatComposerProps } from './lib'

const ROUND = 'grid size-11 shrink-0 place-items-center rounded-full md:size-9'

/** The ask as a card: what rides with it, the text, then + · model · effort · YOLO · Send or Stop. */
export function ChatComposer({ composer, inputRef }: ChatComposerProps) {
  const inference = useInference()
  const { running, session } = useComposerSession()
  const { attachOpen, setAttachOpen } = composer

  return (
    <>
      <div className="rounded-[26px] border border-border bg-card px-3 pt-3 pb-2.5 shadow-[0_2px_12px_rgb(0_0_0/0.06)] focus-within:border-ring/60 md:px-4">
        {composer.attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {composer.attachments.map((ref) => (
              <span
                key={ref.id}
                className="flex h-8 items-center gap-1.5 rounded-xl bg-muted pr-1 pl-2.5 text-[12.5px]"
              >
                {ref.kind === 'page' ? (
                  <IconFileText className="size-4 text-muted-foreground" />
                ) : (
                  <IconFile className="size-4 text-muted-foreground" />
                )}
                <span className="max-w-[200px] truncate font-medium">{ref.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${ref.name}`}
                  onClick={() => composer.detach(ref.id)}
                  className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <IconX className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="px-1">
          <AutosizeTextarea
            value={composer.draft}
            onChange={composer.setDraft}
            onSubmit={composer.submit}
            placeholder="Ask Washi, or tell it what to make…"
            className="min-h-7 text-[16px] leading-7 md:text-[15px]"
            inputRef={inputRef}
          />
        </div>
        {composer.error && (
          <p className="px-1 pt-1 text-[12.5px] text-destructive">{composer.error}</p>
        )}
        <div className="mt-2 flex min-w-0 items-center gap-1.5">
          <div className="relative">
            <button
              type="button"
              aria-label="Attach"
              aria-expanded={attachOpen}
              onClick={() => setAttachOpen((open) => !open)}
              disabled={composer.uploading}
              className={`${ROUND} border border-border text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50 ${attachOpen ? 'bg-accent' : ''}`}
            >
              <IconPlus className={`size-[18px] ${composer.uploading ? 'animate-pulse' : ''}`} />
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
          <div className="flex min-w-0 items-center gap-1.5">
            <OptionChips session={session} inference={inference} />
          </div>
          {running ? (
            <button
              type="button"
              aria-label="Stop"
              title="Stop"
              onClick={() => void useAgentStore.getState().stopTurn()}
              className={`${ROUND} ml-auto bg-foreground text-background`}
            >
              <IconPlayerStopFilled className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Send"
              title="Send"
              disabled={!composer.draft.trim() || composer.uploading}
              onClick={composer.submit}
              className={`${ROUND} ml-auto bg-primary text-primary-foreground disabled:opacity-35`}
            >
              <IconArrowUp className="size-[18px]" />
            </button>
          )}
        </div>
      </div>
      <YoloNote session={session} inference={inference} />
    </>
  )
}
