import { useNoticeStore } from '@washi/ui'
import { useBookStore } from '@/components/shared/book'
import type { ActionProps, SourceProps } from './lib'

function Action({ children, onClick }: ActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-6 rounded-[7px] border border-border bg-background px-2 text-[12px] text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      {children}
    </button>
  )
}

/** The page's WSX: read it, copy it, or step into scratch and rewrite it by hand. */
export function Source({ source }: SourceProps) {
  const book = useBookStore()
  const say = (message: string) => useNoticeStore.getState().say(message)
  const copy = () =>
    navigator.clipboard
      .writeText(source)
      .then(() => say('WSX copied'))
      .catch(() => say('The clipboard said no — select the text instead'))

  return (
    <section className="grid h-56 grid-rows-[28px_minmax(0,1fr)]">
      <div className="flex items-center gap-2 bg-card px-4 text-[11px] text-muted-foreground uppercase tracking-[0.08em]">
        {book.view === 'scratch' ? 'scratch · edited by hand' : 'wsx · what the knobs wrote'}
        <span className="ml-auto flex gap-1.5">
          <Action onClick={copy}>copy</Action>
          {book.view === 'scratch' ? (
            <Action onClick={() => book.set({ view: 'single' })}>back to knobs</Action>
          ) : (
            <Action
              onClick={() => {
                book.setScratch(source)
                book.set({ view: 'scratch' })
              }}
            >
              edit in scratch
            </Action>
          )}
        </span>
      </div>
      {book.view === 'scratch' ? (
        <textarea
          value={book.scratch ?? source}
          onChange={(event) => book.setScratch(event.target.value)}
          spellCheck={false}
          className="resize-none bg-card/60 px-4 py-2 font-mono text-[12px] leading-[1.5] outline-none"
        />
      ) : (
        <pre className="overflow-auto bg-card/60 px-4 py-2 font-mono text-[12px] leading-[1.5]">
          {source}
        </pre>
      )}
    </section>
  )
}
