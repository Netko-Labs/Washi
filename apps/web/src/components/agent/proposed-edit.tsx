import type { ProposedEditProps } from './lib'

const PREVIEW_CHARS = 600

/** What a sheet_replace would change, shown before anyone is asked to allow it. */
export function ProposedEdit({ diff }: ProposedEditProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border text-[12px]">
      <p className="border-border border-b bg-muted px-3 py-1.5 font-bold">
        Washi suggests an edit · {diff.path}
      </p>
      <div className="grid max-h-56 gap-1 overflow-auto p-2">
        <pre className="whitespace-pre-wrap rounded-md bg-destructive/10 px-2 py-1 font-mono text-[11px] text-muted-foreground line-through">
          {diff.oldText.slice(0, PREVIEW_CHARS)}
        </pre>
        <pre className="whitespace-pre-wrap rounded-md bg-emerald-500/10 px-2 py-1 font-mono text-[11px]">
          {diff.newText.slice(0, PREVIEW_CHARS)}
        </pre>
      </div>
    </div>
  )
}
