import type { ReactNode } from 'react'

export interface BlockProps {
  className?: string
  children?: ReactNode
}

function cx(base: string, extra?: string): string {
  return extra ? `${base} ${extra}` : base
}

export function H1({ className, children }: BlockProps) {
  return (
    <h1 className={cx('mt-6 mb-2 font-bold text-3xl tracking-tight', className)}>{children}</h1>
  )
}

export function H2({ className, children }: BlockProps) {
  return <h2 className={cx('mt-5 mb-2 font-semibold text-2xl', className)}>{children}</h2>
}

export function H3({ className, children }: BlockProps) {
  return <h3 className={cx('mt-4 mb-1 font-semibold text-lg', className)}>{children}</h3>
}

export function P({ className, children }: BlockProps) {
  return <p className={cx('my-2 leading-relaxed', className)}>{children}</p>
}

export function Quote({ className, children }: BlockProps) {
  return (
    <blockquote
      className={cx('my-3 border-border border-l-4 pl-4 text-muted-foreground italic', className)}
    >
      {children}
    </blockquote>
  )
}

const TONE_CLASSES = {
  info: 'border-border bg-muted',
  warning: 'border-yellow-600/40 bg-yellow-500/10',
  success: 'border-green-600/40 bg-green-500/10',
  danger: 'border-destructive/40 bg-destructive/10',
} as const

export function Callout({
  tone = 'info',
  className,
  children,
}: BlockProps & { tone?: keyof typeof TONE_CLASSES }) {
  return (
    <div
      className={cx(`my-3 rounded-lg border px-4 py-3 text-sm ${TONE_CLASSES[tone]}`, className)}
    >
      {children}
    </div>
  )
}

export function Code({ className, children }: BlockProps & { lang?: string }) {
  return (
    <pre
      className={cx('my-3 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm', className)}
    >
      <code>{children}</code>
    </pre>
  )
}

export function Divider() {
  return <hr className="my-6 border-border" />
}

export function Tag({ className, children }: BlockProps) {
  return (
    <span
      className={cx(
        'mx-0.5 inline-block rounded bg-accent px-1.5 py-0.5 font-medium text-xs',
        className,
      )}
    >
      {children}
    </span>
  )
}
