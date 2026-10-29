import type { ReactNode } from 'react'
import { styled, toneOf, useBind, useExprValue } from '../lib'
import type { BlockProps, Row } from '../lib/types'
import { usePaperHost } from '../provider'
import type { BindQuery } from '../registry'
import { RowProvider } from '../state'
import { Chart } from './chart'
import { tableLabel } from './database'
import { Bound, cell } from './states'

export { Chart }

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

export function Table({
  bind,
  columns,
  empty,
  ...rest
}: BlockProps & { bind: BindQuery; columns?: string[]; empty?: string }) {
  const state = useBind(bind)
  const { openRow, locale } = usePaperHost()
  return (
    <Bound state={state} empty={empty}>
      {(rows) => {
        const keys = columns ?? Object.keys(rows[0] ?? {}).filter((key) => key !== 'id')
        const numeric = new Set(
          keys.filter((key) => rows.some((row) => typeof row[key] === 'number')),
        )
        const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })
        return (
          <div {...styled(rest, 'wsx-table-wrap')}>
            <table className="wsx-table">
              <thead>
                <tr>
                  {keys.map((key) => (
                    <th key={key} data-num={numeric.has(key) || undefined}>
                      {tableLabel(key)}
                    </th>
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
                    {keys.map((key, column) => {
                      const value = row[key]
                      const isNumber = typeof value === 'number'
                      // A word that means something wears its tone here too (D84); a title never.
                      const tone =
                        column > 0 && typeof value === 'string' ? toneOf(value) : undefined
                      return (
                        <td
                          key={key}
                          data-label={tableLabel(key)}
                          data-num={numeric.has(key) || undefined}
                          data-negative={(isNumber && value < 0) || undefined}
                          data-bool={typeof value === 'boolean' ? String(value) : undefined}
                        >
                          {isNumber ? (
                            number.format(value)
                          ) : tone ? (
                            <Badge size="sm" tone={tone}>
                              {value}
                            </Badge>
                          ) : (
                            cell(value, locale)
                          )}
                        </td>
                      )
                    })}
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
  format,
  ...rest
}: BlockProps & {
  value?: string | number
  expr?: string
  label: string
  hint?: string
  trend?: keyof typeof TREND_GLYPH
  format?: 'number' | 'percent'
}) {
  const host = usePaperHost()
  const computed = useExprValue(expr)
  const raw = expr ? computed : (value ?? null)
  const asNumber =
    format === 'percent'
      ? { style: 'percent' as const, maximumFractionDigits: 1 }
      : { maximumFractionDigits: 2 }
  const shown =
    typeof raw === 'number'
      ? new Intl.NumberFormat(host.locale, asNumber).format(raw)
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
  const given = Number(value ?? 0) || 0
  const ratio = Math.min(1, Math.max(0, typeof computed === 'number' ? computed : given))
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
