import { type ReactNode, useId, useRef, useState } from 'react'
import { type SheetStateValue, useSheetState } from '../state'
import type { BlockProps } from './typography'

function cx(base: string, extra?: string): string {
  return extra ? `${base} ${extra}` : base
}

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
  return (not ? !matches : matches) ? <>{children}</> : null
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
    <label className={cx('my-1 inline-flex cursor-pointer items-center gap-2 text-sm', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => set(state, !on)}
        className={`h-5 w-9 rounded-full p-0.5 transition-colors ${on ? 'bg-primary' : 'bg-border'}`}
      >
        <span
          className={`block size-4 rounded-full bg-card shadow-sm transition-transform ${on ? 'translate-x-4' : ''}`}
        />
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
    <label className={cx('my-2 block text-sm', className)}>
      {label && (
        <span className="mb-1 flex justify-between text-muted-foreground text-xs">
          <span>{label}</span>
          <span className="font-mono">{value}</span>
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
    <div className={cx('my-3', className)}>
      <div className="flex gap-1 border-border border-b">
        {labels.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => select(index)}
            className={`-mb-px border-b-2 px-3 py-1.5 font-medium text-sm ${
              index === active
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="pt-3">{panels[active]}</div>
    </div>
  )
}

export function Tab({ children, className }: BlockProps) {
  return <div className={className}>{children}</div>
}

export function Accordion({ children, className }: BlockProps) {
  return (
    <div className={cx('my-3 divide-y divide-border rounded-lg border border-border', className)}>
      {children}
    </div>
  )
}

export function AccordionItem({ title, className, children }: BlockProps & { title: string }) {
  return (
    <details className={cx('group px-4 py-2.5', className)}>
      <summary className="flex cursor-pointer items-center justify-between font-medium text-sm">
        {title}
        <span className="text-muted-foreground transition-transform group-open:rotate-90">›</span>
      </summary>
      <div className="pt-2 text-muted-foreground text-sm">{children}</div>
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
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className={cx(
          'my-1 inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 font-medium text-sm hover:bg-accent',
          className,
        )}
      >
        {trigger}
      </button>
      <dialog
        ref={ref}
        className="m-auto w-full max-w-md rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xl backdrop:bg-black/40"
      >
        <div className="mb-2 flex items-center justify-between">
          {title && <div className="font-bold font-display">{title}</div>}
          <button
            type="button"
            aria-label="Close dialog"
            onClick={() => ref.current?.close()}
            className="ml-auto text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <div className="text-sm">{children}</div>
      </dialog>
    </>
  )
}

export function Tooltip({ label, className, children }: BlockProps & { label: string }) {
  const id = useId()
  return (
    <span className={cx('group relative inline-block', className)} aria-describedby={id}>
      {children}
      <span
        id={id}
        role="tooltip"
        className="-translate-x-1/2 pointer-events-none absolute bottom-full left-1/2 mb-1.5 hidden whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-background text-xs group-hover:block"
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
    <span
      className={cx(
        `mx-0.5 inline-flex items-center rounded-md px-2 py-0.5 font-medium text-xs ${BADGE_TONES[tone]}`,
        className,
      )}
    >
      {children}
    </span>
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
    <span
      title={label}
      className={cx(
        'mx-0.5 inline-grid size-8 place-items-center rounded-full bg-muted align-middle font-medium text-muted-foreground text-xs',
        className,
      )}
    >
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
    <div className={cx('my-2 h-2 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('my-1 h-4 animate-pulse rounded-md bg-muted', className)} />
}

export function Kbd({ className, children }: BlockProps) {
  return (
    <kbd
      className={cx(
        'mx-0.5 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px]',
        className,
      )}
    >
      {children}
    </kbd>
  )
}
