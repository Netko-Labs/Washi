import type { InkQuery } from '@washi/ink'
import type { ReactNode } from 'react'
import { styled, useBind, useExprValue } from '../lib'
import type { BlockProps, Row } from '../lib/types'
import { usePaperHost } from '../provider'
import { RowProvider } from '../state'
import { Chart } from './chart'
import { Bound, cell } from './states'

export { Chart }

/** Renders children once per row with `$row.column` in scope. The power multiplier. */
export function Repeat({
  bind,
  empty,
  children,
  ...rest
}: BlockProps & { bind: InkQuery; empty?: string; children: (row: Row) => ReactNode }) {
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

export function Table({
  bind,
  columns,
  empty,
  ...rest
}: BlockProps & { bind: InkQuery; columns?: string[]; empty?: string }) {
  const state = useBind(bind)
  const { openRow } = usePaperHost()
  return (
    <Bound state={state} empty={empty}>
      {(rows) => {
        const keys = columns ?? Object.keys(rows[0] ?? {}).filter((key) => key !== 'id')
        return (
          <div {...styled(rest, 'wsx-table-wrap')}>
            <table className="wsx-table">
              <thead>
                <tr>
                  {keys.map((key) => (
                    <th key={key}>{key.replace(/_/g, ' ')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={String(row.id ?? index)}
                    data-openable={openRow && typeof row.id === 'string' ? '' : undefined}
                    onClick={() => typeof row.id === 'string' && openRow?.(row.id)}
                  >
                    {keys.map((key) => (
                      <td key={key} data-num={typeof row[key] === 'number' || undefined}>
                        {cell(row[key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }}
    </Bound>
  )
}

const TREND_GLYPH = { up: '↑', down: '↓', flat: '→' } as const

export function Stat({
  value,
  expr,
  label,
  hint,
  trend,
  ...rest
}: BlockProps & {
  value?: string | number
  expr?: string
  label: string
  hint?: string
  trend?: keyof typeof TREND_GLYPH
}) {
  const host = usePaperHost()
  const computed = useExprValue(expr)
  const raw = expr ? computed : (value ?? null)
  const shown =
    typeof raw === 'number'
      ? new Intl.NumberFormat(host.locale, { maximumFractionDigits: 2 }).format(raw)
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
}: BlockProps & { value?: number; expr?: string; label?: string }) {
  const computed = useExprValue(expr)
  const ratio = Math.min(1, Math.max(0, typeof computed === 'number' ? computed : (value ?? 0)))
  const percent = Math.round(ratio * 100)
  return (
    <div
      {...styled(rest, 'wsx-progress')}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      {label && (
        <div className="wsx-progress-label">
          <span>{label}</span>
          <span>{percent}%</span>
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
