import type { ReactNode } from 'react'
import { cn } from '../lib'

export interface BlockProps {
  className?: string
  children?: ReactNode
}

/**
 * Primitives carry semantics, not appearance (spec Q15). Everything here is a
 * bare tag plus whatever the sheet asked for — no margins, no radii, no colour.
 * Blocks that need structure to function keep only that.
 */

export function H1({ className, children }: BlockProps) {
  return <h1 className={className}>{children}</h1>
}

export function H2({ className, children }: BlockProps) {
  return <h2 className={className}>{children}</h2>
}

export function H3({ className, children }: BlockProps) {
  return <h3 className={className}>{children}</h3>
}

export function P({ className, children }: BlockProps) {
  return <p className={className}>{children}</p>
}

export function Quote({ className, children }: BlockProps) {
  return <blockquote className={className}>{children}</blockquote>
}

const TONE_CLASSES = {
  info: 'border-border bg-muted',
  warning: 'border-yellow-600/40 bg-yellow-500/10',
  success: 'border-green-600/40 bg-green-500/10',
  danger: 'border-destructive/40 bg-destructive/10',
} as const

/** `tone` is a semantic default the sheet can override like any other class. */
export function Callout({
  tone = 'info',
  className,
  children,
}: BlockProps & { tone?: keyof typeof TONE_CLASSES }) {
  return <div className={cn('border', TONE_CLASSES[tone], className)}>{children}</div>
}

export function Code({ className, children }: BlockProps & { lang?: string }) {
  return (
    <pre className={cn('overflow-x-auto whitespace-pre-wrap font-mono', className)}>
      <code>{children}</code>
    </pre>
  )
}

export function Divider({ className }: { className?: string }) {
  return <hr className={className} />
}

export function Tag({ className, children }: BlockProps) {
  return <span className={className}>{children}</span>
}
