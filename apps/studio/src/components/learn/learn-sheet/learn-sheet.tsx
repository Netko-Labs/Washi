import { IconCheck, IconCopy } from '@tabler/icons-react'
import { WsxView } from '@washi/paper'
import { compileSheet } from '@washi/paper/book'
import { useMemo } from 'react'
import { type LearnSheetProps, useCopied } from '../lib'

/** An example drawn live over the book's in-memory table, its WSX under it to read or copy. */
export function LearnSheet({ source, open }: LearnSheetProps) {
  const compiled = useMemo(() => compileSheet(source), [source])
  const copied = useCopied()

  return (
    <figure className="learn-sheet overflow-hidden rounded-xl border border-border bg-card">
      {compiled.root ? (
        <WsxView root={compiled.root} />
      ) : (
        <ul className="p-4 font-mono text-[12px] text-destructive">
          {compiled.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
      <details open={open} className="group/src border-border border-t">
        <summary className="cursor-pointer select-none px-4 py-2 text-[12px] text-muted-foreground hover:text-foreground">
          WSX
        </summary>
        <div className="relative">
          <button
            type="button"
            onClick={() => copied.copy(source)}
            aria-label="Copy the WSX"
            title="Copy"
            className="absolute top-1 right-2 grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {copied.isCopied ? <IconCheck className="size-4" /> : <IconCopy className="size-4" />}
          </button>
          <pre className="overflow-x-auto px-4 pt-1 pb-3 pr-12 font-mono text-[12px] leading-relaxed">
            {source}
          </pre>
        </div>
      </details>
    </figure>
  )
}
