import type { CSSProperties } from 'react'
import type { BlockProps } from './typography'

function cx(base: string, extra?: string): string {
  return extra ? `${base} ${extra}` : base
}

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
    <header className={cx(`mt-2 mb-6 ${align === 'center' ? 'text-center' : ''}`, className)}>
      <h1
        className={`font-bold tracking-tight ${size === 'lg' ? 'text-5xl leading-none' : 'text-4xl'}`}
      >
        {title}
        <span style={{ color: 'var(--sheet-accent, var(--primary))' }}>。</span>
      </h1>
      {subtitle && (
        <p className="mt-3 max-w-xl text-lg text-muted-foreground leading-snug">{subtitle}</p>
      )}
    </header>
  )
}

export function Tape({ color, className, children }: BlockProps & { color?: TapeColor }) {
  return (
    <span
      className={cx(
        `-rotate-1 my-2 inline-block px-4 py-1.5 font-bold text-white text-xs uppercase tracking-widest shadow-sm ${color ? TAPE_BG[color] : ''}`,
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
      className={cx(
        '-rotate-3 mx-1 inline-grid size-10 place-items-center rounded-full border-2 font-bold font-display text-xs',
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
    <span
      className={cx(
        'mx-0.5 my-0.5 inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 font-mono text-xs',
        className,
      )}
    >
      <span
        className={`size-1.5 rounded-full ${color ? TAPE_BG[color] : ''}`}
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
    <div className={cx('my-2 rounded-lg border border-border bg-card p-4 shadow-sm', className)}>
      <div className="font-bold font-display text-3xl tracking-tight">{value}</div>
      <div className="mt-0.5 text-muted-foreground text-xs uppercase tracking-wide">{label}</div>
      {hint && <div className="mt-1 font-mono text-[10px] text-muted-foreground">{hint}</div>}
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
    <div
      className={cx(
        'relative my-2 rounded-lg border border-border bg-card p-4 shadow-sm',
        className,
      )}
    >
      {accent && <span className={`absolute top-0 left-4 h-1 w-10 rounded-b ${TAPE_BG[accent]}`} />}
      {title && <div className="mb-1.5 font-bold font-display text-sm">{title}</div>}
      {children}
    </div>
  )
}

export function Timeline({ className, children }: BlockProps) {
  return <ol className={cx('my-4 list-none space-y-0 p-0', className)}>{children}</ol>
}

export function Step({
  marker,
  title,
  color,
  className,
  children,
}: BlockProps & { marker: string; title?: string; color?: TapeColor }) {
  return (
    <li className={cx('relative grid grid-cols-[3rem_1fr] gap-3 pb-5', className)}>
      <span className="absolute top-8 bottom-0 left-5.5 w-0.5 bg-border [li:last-child>&]:hidden" />
      <span
        className={`-rotate-2 grid h-7 w-11 place-items-center rounded-md font-bold font-mono text-white text-xs shadow-sm ${color ? TAPE_BG[color] : ''}`}
        style={fillStyle(color)}
      >
        {marker}
      </span>
      <div className="min-w-0 pt-0.5">
        {title && <div className="font-bold font-display text-sm">{title}</div>}
        <div className="text-muted-foreground text-sm">{children}</div>
      </div>
    </li>
  )
}
