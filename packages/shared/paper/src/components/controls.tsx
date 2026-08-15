import { type ReactNode, useId, useRef, useState } from 'react'
import { cn } from '../lib'
import { type SheetStateValue, useSheetState } from '../state'
import type { BlockProps } from './typography'

/**
 * Controls keep only what makes them work — state-driven transforms, modal
 * positioning, the hover machinery — plus the minimum that keeps them visible.
 * Rhythm, type and palette belong to the sheet (spec Q15); twMerge means any
 * class it writes wins over the defaults here.
 */

export function Show({
  when,
  equals = true,
  not = false,
  children,
}: {
  when: string
  equals?: SheetStateValue
  not?: boolean
  children?: ReactNode
}) {
  const { values } = useSheetState()
  const matches = (values[when] ?? null) === equals
  return (not ? !matches : matches) ? children : null
}

export function Switch({
  state,
  label,
  className,
}: {
  state: string
  label?: string
  className?: string
}) {
  const { values, set } = useSheetState()
  const on = values[state] === true
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => set(state, !on)}
        className={cn('h-5 w-9 shrink-0 rounded-full p-0.5', on ? 'bg-primary' : 'bg-border')}
      >
        <span className={cn('block size-4 rounded-full bg-card', on && 'translate-x-4')} />
      </button>
      {label}
    </label>
  )
}

export function Slider({
  state,
  min = 0,
  max = 100,
  step = 1,
  label,
  className,
}: {
  state: string
  min?: number
  max?: number
  step?: number
  label?: string
  className?: string
}) {
  const { values, set } = useSheetState()
  const value = typeof values[state] === 'number' ? (values[state] as number) : min
  return (
    <label className={cn('block', className)}>
      {label && (
        <span className="flex justify-between">
          <span>{label}</span>
          <span>{value}</span>
        </span>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => set(state, Number(event.target.value))}
        className="w-full accent-primary"
      />
    </label>
  )
}

export function Tabs({
  state,
  children,
  className,
  labels,
}: BlockProps & { state?: string; labels: string[] }) {
  const sheetState = useSheetState()
  const [internal, setInternal] = useState(0)
  const active = state
    ? Math.max(0, labels.indexOf(String(sheetState.values[state] ?? labels[0])))
    : internal
  const select = (index: number) =>
    state ? sheetState.set(state, labels[index] ?? null) : setInternal(index)

  const panels = Array.isArray(children) ? children : [children]
  return (
    <div className={className}>
      <div className="flex gap-1">
        {labels.map((label, index) => (
          <button
            key={label}
            type="button"
            data-active={index === active || undefined}
            onClick={() => select(index)}
          >
            {label}
          </button>
        ))}
      </div>
      <div>{panels[active]}</div>
    </div>
  )
}

export function Tab({ children, className }: BlockProps) {
  return <div className={className}>{children}</div>
}

export function Accordion({ children, className }: BlockProps) {
  return <div className={className}>{children}</div>
}

export function AccordionItem({ title, className, children }: BlockProps & { title: string }) {
  return (
    <details className={cn('group', className)}>
      <summary className="flex cursor-pointer items-center justify-between">{title}</summary>
      <div>{children}</div>
    </details>
  )
}

export function Dialog({
  trigger,
  title,
  className,
  children,
}: BlockProps & { trigger: string; title?: string }) {
  const ref = useRef<HTMLDialogElement>(null)
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className={className}>
        {trigger}
      </button>
      <dialog ref={ref} className="m-auto w-full max-w-[min(32rem,90vw)] bg-card p-5">
        <div className="flex items-center justify-between">
          {title && <div>{title}</div>}
          <button
            type="button"
            aria-label="Close dialog"
            onClick={() => ref.current?.close()}
            className="ml-auto"
          >
            ✕
          </button>
        </div>
        <div>{children}</div>
      </dialog>
    </>
  )
}

export function Tooltip({ label, className, children }: BlockProps & { label: string }) {
  const id = useId()
  return (
    <span className={cn('group relative inline-block', className)} aria-describedby={id}>
      {children}
      <span
        id={id}
        role="tooltip"
        className="-translate-x-1/2 pointer-events-none absolute bottom-full left-1/2 hidden whitespace-nowrap bg-foreground px-2 py-1 text-background group-hover:block"
      >
        {label}
      </span>
    </span>
  )
}

const BADGE_TONES = {
  default: 'bg-primary text-primary-foreground',
  outline: 'border border-border text-foreground',
  muted: 'bg-muted text-muted-foreground',
  destructive: 'bg-destructive text-white',
} as const

export function Badge({
  tone = 'default',
  className,
  children,
}: BlockProps & { tone?: keyof typeof BADGE_TONES }) {
  return (
    <span className={cn('inline-flex items-center', BADGE_TONES[tone], className)}>{children}</span>
  )
}

export function Avatar({ label, className }: { label: string; className?: string }) {
  const initials = label
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <span title={label} className={cn('inline-grid place-items-center', className)}>
      {initials}
    </span>
  )
}

export function Progress({
  value,
  max = 100,
  className,
}: {
  value: number
  max?: number
  className?: string
}) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={cn('h-2 w-full overflow-hidden bg-muted', className)}>
      <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('h-4 animate-pulse bg-muted', className)} />
}

export function Kbd({ className, children }: BlockProps) {
  return <kbd className={className}>{children}</kbd>
}
