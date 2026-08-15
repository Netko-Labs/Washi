import { useEffect, useState } from 'react'
import { cn } from '../lib'
import { type ActionRef, usePaperHost } from '../provider'
import type { BlockProps } from './typography'

export function Img({ src, alt, className }: { src: string; alt?: string; className?: string }) {
  return <img src={src} alt={alt ?? ''} className={cn('max-w-full', className)} />
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
      className={cn('inline underline underline-offset-2', className)}
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
      className={cn('inline-flex items-center disabled:opacity-50', className)}
    >
      {children}
    </button>
  )
}

export function Toggle({ label, className, children }: BlockProps & { label: string }) {
  return (
    <details className={className}>
      <summary className="cursor-pointer">{label}</summary>
      <div>{children}</div>
    </details>
  )
}

export function Columns({ className, children }: BlockProps) {
  return <div className={cn('flex flex-wrap gap-4', className)}>{children}</div>
}

export function Column({ className, children }: BlockProps) {
  return <div className={cn('min-w-0 flex-1 basis-64', className)}>{children}</div>
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
    <div className={className}>
      <div className="truncate">{url}</div>
      {state.status === 'loading' && <div>fetching…</div>}
      {state.status === 'error' && <div className="text-destructive">{state.body}</div>}
      {state.status === 'done' && (
        <pre className="overflow-x-auto whitespace-pre-wrap">{state.body}</pre>
      )}
    </div>
  )
}
