import { useEffect, useState } from 'react'
import { type ActionRef, usePaperHost } from '../provider'
import type { BlockProps } from './typography'

function cx(base: string, extra?: string): string {
  return extra ? `${base} ${extra}` : base
}

export function Img({ src, alt, className }: { src: string; alt?: string; className?: string }) {
  return <img src={src} alt={alt ?? ''} className={cx('my-3 max-w-full rounded-lg', className)} />
}

export function Ref({ sheet, className, children }: BlockProps & { sheet: string }) {
  const host = usePaperHost()
  const [title, setTitle] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    host.resolveSheet(sheet).then((resolved) => {
      if (alive && resolved) setTitle(resolved.title)
    })
    return () => {
      alive = false
    }
  }, [host, sheet])

  return (
    <button
      type="button"
      onClick={() => host.openSheet(sheet)}
      className={cx(
        'inline text-primary underline decoration-primary/40 underline-offset-2',
        className,
      )}
    >
      {children ?? title ?? sheet}
    </button>
  )
}

export function Button({ action, className, children }: BlockProps & { action: ActionRef }) {
  const host = usePaperHost()
  const [busy, setBusy] = useState(false)

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        try {
          await host.runAction(action)
        } finally {
          setBusy(false)
        }
      }}
      className={cx(
        'my-1 inline-flex items-center rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground text-sm disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Toggle({ label, className, children }: BlockProps & { label: string }) {
  return (
    <details className={cx('my-2 rounded-md border border-border px-3 py-2', className)}>
      <summary className="cursor-pointer font-medium text-sm">{label}</summary>
      <div className="pt-2">{children}</div>
    </details>
  )
}

export function Columns({ className, children }: BlockProps) {
  return <div className={cx('my-3 flex gap-4', className)}>{children}</div>
}

export function Column({ className, children }: BlockProps) {
  return <div className={cx('min-w-0 flex-1', className)}>{children}</div>
}

export function Fetch({
  url,
  as = 'text',
  className,
}: {
  url: string
  as?: 'text' | 'json'
  className?: string
}) {
  const host = usePaperHost()
  const [state, setState] = useState<{ status: 'loading' | 'done' | 'error'; body: string }>({
    status: 'loading',
    body: '',
  })

  useEffect(() => {
    let alive = true
    host
      .runFetch(url)
      .then((body) => {
        if (!alive) return
        const rendered =
          as === 'json'
            ? JSON.stringify(JSON.parse(body), null, 2).slice(0, 4000)
            : body.slice(0, 4000)
        setState({ status: 'done', body: rendered })
      })
      .catch((error: unknown) => {
        if (alive) setState({ status: 'error', body: String(error) })
      })
    return () => {
      alive = false
    }
  }, [host, url, as])

  return (
    <div className={cx('my-3 rounded-lg border border-border bg-muted/50 p-3 text-sm', className)}>
      <div className="mb-1 truncate font-mono text-muted-foreground text-xs">{url}</div>
      {state.status === 'loading' && <div className="text-muted-foreground">fetching…</div>}
      {state.status === 'error' && <div className="text-destructive">{state.body}</div>}
      {state.status === 'done' && (
        <pre className="overflow-x-auto whitespace-pre-wrap">{state.body}</pre>
      )}
    </div>
  )
}
