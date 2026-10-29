import type { ReactNode } from 'react'
import { formatNumber, ratioOf, styled, useBind, useExprValue } from '../lib'
import type { BlockProps, Row } from '../lib/types'
import { usePaperHost } from '../provider'
import type { BindQuery } from '../registry'
import { RowProvider } from '../state'
import { Chart } from './chart'
import { Bound } from './states'
import { Table } from './table'

export { Chart, Table }

/** Renders children once per row with `$row.column` in scope. The power multiplier. */
export function Repeat({
  bind,
  empty,
  children,
  ...rest
}: BlockProps & { bind: BindQuery; empty?: string; children: (row: Row) => ReactNode }) {
  const state = useBind(bind)
  return (
    <div {...styled(rest, 'wsx-repeat wsx-stack')}>
      <Bound state={state} empty={empty}>
        {(rows) =>
          rows.map((row, index) => (
            <RowProvider key={String(row.id ?? index)} row={row}>
              {children(row)}
            </RowProvider>
          ))
        }
      </Bound>
    </div>
  )
}

const TREND_GLYPH = { up: '↑', down: '↓', flat: '→' } as const

export function Stat({
  value,
  expr,
  label,
  hint,
  trend,
  format,
  currency,
  ...rest
}: BlockProps & {
  value?: string | number
  expr?: string
  label: string
  hint?: string
  trend?: keyof typeof TREND_GLYPH
  format?: 'number' | 'percent'
  currency?: string
}) {
  const host = usePaperHost()
  const computed = useExprValue(expr)
  const raw = expr ? computed : (value ?? null)
  const shown =
    typeof raw === 'number'
      ? formatNumber(raw, host.locale, currency ?? (format === 'percent' ? 'percent' : undefined))
      : raw === null
        ? '—'
        : String(raw)
  return (
    <div {...styled(rest, 'wsx-stat')}>
      <div className="wsx-stat-value">
        {shown}
        {trend && (
          <span className="wsx-stat-trend" data-trend={trend}>
            {TREND_GLYPH[trend]}
          </span>
        )}
      </div>
      <div className="wsx-stat-label">{label}</div>
      {hint && <div className="wsx-stat-hint">{hint}</div>}
    </div>
  )
}

export function Timeline({ children, ...rest }: BlockProps) {
  return <ol {...styled(rest, 'wsx-timeline')}>{children}</ol>
}

export function Step({
  marker,
  title,
  children,
  ...rest
}: BlockProps & { marker: string; title?: string }) {
  return (
    <li {...styled(rest, 'wsx-step')}>
      <span className="wsx-step-marker">{marker}</span>
      <div>
        {title && <div className="wsx-step-title">{title}</div>}
        <div className="wsx-step-body">{children}</div>
      </div>
    </li>
  )
}

export function Progress({
  value,
  expr,
  label,
  ...rest
}: BlockProps & { value?: number | string; expr?: string; label?: string }) {
  const computed = useExprValue(expr)
  const ratio = ratioOf(value, expr, computed)
  const isUnknown = ratio === null
  const percent = Math.round((ratio ?? 0) * 100)
  return (
    <div
      {...styled(rest, 'wsx-progress')}
      role="progressbar"
      data-unknown={isUnknown || undefined}
      aria-valuenow={isUnknown ? undefined : percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      {label && (
        <div className="wsx-progress-label">
          <span>{label}</span>
          <span>{isUnknown ? '—' : `${percent}%`}</span>
        </div>
      )}
      <div className="wsx-progress-track">
        <div className="wsx-progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export function Badge({ expr, children, ...rest }: BlockProps & { expr?: string }) {
  const computed = useExprValue(expr)
  return <span {...styled(rest, 'wsx-badge')}>{expr ? String(computed ?? '') : children}</span>
}

export function Avatar({ label, ...rest }: BlockProps & { label: string }) {
  const initials = label
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <span {...styled(rest, 'wsx-avatar')} role="img" title={label} aria-label={label}>
      {initials}
    </span>
  )
}
