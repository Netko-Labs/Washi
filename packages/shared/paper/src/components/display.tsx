import type { CSSProperties } from 'react'
import { cn } from '../lib'
import type { BlockProps } from './typography'

export type TapeColor = 'pink' | 'teal' | 'blue' | 'mustard' | 'violet' | 'moss' | 'slate'

export const TAPE_BG: Record<TapeColor, string> = {
  pink: 'bg-tape-pink',
  teal: 'bg-tape-teal',
  blue: 'bg-tape-blue',
  mustard: 'bg-tape-mustard',
  violet: 'bg-tape-violet',
  moss: 'bg-tape-moss',
  slate: 'bg-tape-slate',
}

/** Accent-or-explicit fill: falls back to the sheet theme's --sheet-accent. */
function fillStyle(color?: TapeColor): CSSProperties | undefined {
  return color ? undefined : { backgroundColor: 'var(--sheet-accent, var(--primary))' }
}

/**
 * Structural blocks. They compose child slots the sheet cannot express with
 * Box alone; they no longer decide how those slots look (spec Q15). Tape and
 * Stamp keep their shapes, because the shape is the component — the washi look
 * is now something a sheet reaches for rather than something it inherits.
 */

export function Hero({
  title,
  subtitle,
  align = 'left',
  size = 'md',
  className,
}: {
  title: string
  subtitle?: string
  align?: 'left' | 'center'
  size?: 'md' | 'lg'
  className?: string
}) {
  return (
    <header className={cn(align === 'center' && 'text-center', className)}>
      <h1 className={size === 'lg' ? 'text-5xl leading-none' : 'text-4xl'}>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </header>
  )
}

export function Tape({ color, className, children }: BlockProps & { color?: TapeColor }) {
  return (
    <span
      className={cn(
        '-rotate-1 inline-block px-4 py-1.5 text-white',
        color ? TAPE_BG[color] : '',
        className,
      )}
      style={{
        ...fillStyle(color),
        backgroundImage:
          'repeating-linear-gradient(90deg, rgb(255 255 255 / 0.18) 0 6px, transparent 6px 14px)',
        clipPath: 'polygon(2% 0, 98% 4%, 100% 92%, 1% 100%)',
      }}
    >
      {children}
    </span>
  )
}

export function Stamp({
  label,
  tone = 'accent',
  className,
}: {
  label: string
  tone?: 'accent' | 'ink'
  className?: string
}) {
  return (
    <span
      className={cn(
        '-rotate-3 inline-grid size-10 place-items-center rounded-full border-2 text-xs',
        className,
      )}
      style={
        tone === 'ink'
          ? { borderColor: 'var(--foreground)', color: 'var(--foreground)' }
          : {
              borderColor: 'var(--sheet-accent, var(--primary))',
              color: 'var(--sheet-accent, var(--primary))',
            }
      }
    >
      {label}
    </span>
  )
}

export function Chip({ color, className, children }: BlockProps & { color?: TapeColor }) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span
        className={cn('size-1.5 shrink-0 rounded-full', color ? TAPE_BG[color] : '')}
        style={fillStyle(color)}
      />
      {children}
    </span>
  )
}

export function Stat({
  value,
  label,
  hint,
  className,
}: {
  value: string
  label: string
  hint?: string
  className?: string
}) {
  return (
    <div className={className}>
      <div>{value}</div>
      <div>{label}</div>
      {hint && <div>{hint}</div>}
    </div>
  )
}

export function Card({
  title,
  accent,
  className,
  children,
}: BlockProps & { title?: string; accent?: TapeColor }) {
  return (
    <div className={cn(accent && 'relative', className)}>
      {accent && <span className={cn('absolute top-0 left-4 h-1 w-10', TAPE_BG[accent])} />}
      {title && <div>{title}</div>}
      {children}
    </div>
  )
}

export function Timeline({ className, children }: BlockProps) {
  return <ol className={cn('list-none p-0', className)}>{children}</ol>
}

export function Step({
  marker,
  title,
  color,
  className,
  children,
}: BlockProps & { marker: string; title?: string; color?: TapeColor }) {
  return (
    <li className={cn('grid grid-cols-[3rem_1fr] gap-3', className)}>
      <span
        className={cn(
          '-rotate-2 grid h-7 w-11 place-items-center text-white',
          color ? TAPE_BG[color] : '',
        )}
        style={fillStyle(color)}
      >
        {marker}
      </span>
      <div className="min-w-0">
        {title && <div>{title}</div>}
        <div>{children}</div>
      </div>
    </li>
  )
}
