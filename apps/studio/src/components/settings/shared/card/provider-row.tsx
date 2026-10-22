import { type ProviderRowProps, sinceLabel } from '../../lib'

/** A provider as a row: the mark, its state in words, and Replace · Remove or Connect. */
export function ProviderRow({ meta, connected, onConnect, onRemove }: ProviderRowProps) {
  const state = connected
    ? `Connected · ••••${connected.last4}${connected.updatedBy ? ` · by ${connected.updatedBy}` : ''}, ${sinceLabel(connected.updatedAt)}`
    : `Not connected · ${meta.blurb}`

  return (
    <div className="flex items-center gap-3 border-border border-t px-4 py-3 text-[13.5px] first:border-t-0">
      <span
        className={`grid size-[30px] shrink-0 place-items-center rounded-lg font-extrabold text-[12px] ${meta.tint}`}
        aria-hidden
      >
        {meta.mark}
      </span>
      <div className="min-w-0 flex-1">
        <div>{meta.label}</div>
        <div className="truncate text-[12px] text-muted-foreground">{state}</div>
      </div>
      <div className="flex shrink-0 gap-1.5">
        {connected ? (
          <>
            <button type="button" onClick={onConnect} className={GHOST}>
              Replace
            </button>
            <button type="button" onClick={onRemove} className={GHOST}>
              Remove
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onConnect}
            className="h-[30px] rounded-lg border border-border bg-background px-3 font-medium text-[12.5px] hover:bg-accent"
          >
            Connect
          </button>
        )}
      </div>
    </div>
  )
}

const GHOST =
  'h-[30px] rounded-lg px-2.5 text-[12.5px] text-muted-foreground hover:bg-accent hover:text-foreground'
