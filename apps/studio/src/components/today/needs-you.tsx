import type { NeedsYouProps } from './lib'

/** Washi asks before anything leaves your server; this is where those questions wait. */
export function NeedsYou({ pending, onDecide }: NeedsYouProps) {
  if (pending.length === 0) return null
  return (
    <section className="rounded-2xl border border-primary/40 bg-primary/5 p-4">
      <h2 className="font-bold text-[14px]">
        Needs you <span className="font-mono text-primary">{pending.length}</span>
      </h2>
      <ul className="mt-3 grid gap-3">
        {pending.map((request) => (
          <li key={request.id} className="rounded-xl bg-card p-3">
            <p className="text-[13.5px]">
              Washi wants to run <span className="font-mono">{request.toolName}</span>
            </p>
            {request.input != null && (
              <pre className="mt-2 max-h-24 overflow-auto rounded-lg bg-muted p-2 font-mono text-[11px]">
                {JSON.stringify(request.input, null, 2).slice(0, 400)}
              </pre>
            )}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => onDecide(request.id, 'allow_once')}
                className="h-11 rounded-xl bg-primary px-4 font-bold text-[13px] text-primary-foreground"
              >
                Allow
              </button>
              <button
                type="button"
                onClick={() => onDecide(request.id, 'reject_once')}
                className="h-11 rounded-xl border border-border px-4 font-bold text-[13px]"
              >
                Deny
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
