import type { InkQuery } from '@washi/ink'
import { styled, useBind } from '../lib'
import type { BlockProps, Row } from '../lib/types'
import { Bound } from './states'

const RAMP = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]
const W = 320
const H = 160
const PAD = 8

interface Point {
  label: string
  value: number
}

function pickColumns(rows: Row[], label?: string, value?: string): [string, string] {
  const first = rows[0] ?? {}
  const labelKey =
    label ??
    Object.keys(first).find((key) => key !== 'id' && typeof first[key] === 'string') ??
    'id'
  const valueKey =
    value ?? Object.keys(first).find((key) => typeof first[key] === 'number') ?? 'count'
  return [labelKey, valueKey]
}

function toPoints(rows: Row[], label?: string, value?: string): Point[] {
  const [labelKey, valueKey] = pickColumns(rows, label, value)
  return rows.map((row) => ({
    label: String(row[labelKey] ?? ''),
    value: typeof row[valueKey] === 'number' ? (row[valueKey] as number) : 0,
  }))
}

function Bars({ points }: { points: Point[] }) {
  const max = Math.max(1, ...points.map((point) => point.value))
  const slot = (W - PAD * 2) / points.length
  const bar = Math.min(slot * 0.62, 44)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img">
      {points.map((point, index) => {
        const height = ((H - 28) * point.value) / max
        const x = PAD + slot * index + (slot - bar) / 2
        return (
          <g key={point.label + index}>
            <rect
              x={x}
              y={H - 20 - height}
              width={bar}
              height={height}
              rx="4"
              fill={RAMP[index % RAMP.length]}
            />
            <text
              x={x + bar / 2}
              y={H - 6}
              textAnchor="middle"
              fontSize="9"
              fill="var(--muted)"
              fontFamily="var(--font-sans)"
            >
              {point.label.length > 14 ? `${point.label.slice(0, 13)}…` : point.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function Lines({ points, area }: { points: Point[]; area: boolean }) {
  const max = Math.max(1, ...points.map((point) => point.value))
  const step = points.length > 1 ? (W - PAD * 2) / (points.length - 1) : 0
  const coords = points.map(
    (point, index) => [PAD + step * index, H - 20 - ((H - 28) * point.value) / max] as const,
  )
  const path = coords
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img">
      {area && (
        <path
          d={`${path} L${W - PAD},${H - 20} L${PAD},${H - 20} Z`}
          fill="var(--chart-1)"
          opacity="0.18"
        />
      )}
      <path d={path} fill="none" stroke="var(--chart-1)" strokeWidth="2" strokeLinejoin="round" />
      {coords.map(([x, y], index) => (
        <circle key={index} cx={x} cy={y} r="3" fill="var(--chart-1)" />
      ))}
    </svg>
  )
}

function Donut({ points }: { points: Point[] }) {
  const total = Math.max(
    1,
    points.reduce((sum, point) => sum + point.value, 0),
  )
  const r = 52
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <svg viewBox="0 0 160 160" role="img" style={{ maxWidth: 180, margin: '0 auto' }}>
      {points.map((point, index) => {
        const length = (c * point.value) / total
        const dash = (
          <circle
            key={point.label + index}
            cx="80"
            cy="80"
            r={r}
            fill="none"
            stroke={RAMP[index % RAMP.length]}
            strokeWidth="22"
            strokeDasharray={`${length} ${c - length}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 80 80)"
          />
        )
        offset += length
        return dash
      })}
    </svg>
  )
}

/** Palette from the chart ramp; series colours are never settable by a page. */
export function Chart({
  bind,
  kind,
  label,
  value,
  empty,
  ...rest
}: BlockProps & {
  bind: InkQuery
  kind: 'bar' | 'line' | 'area' | 'donut'
  label?: string
  value?: string
  empty?: string
}) {
  const state = useBind(bind)
  return (
    <Bound state={state} empty={empty}>
      {(rows) => {
        const points = toPoints(rows, label, value)
        return (
          <div {...styled(rest, 'wsx-chart')} data-kind={kind}>
            {kind === 'bar' && <Bars points={points} />}
            {(kind === 'line' || kind === 'area') && (
              <Lines points={points} area={kind === 'area'} />
            )}
            {kind === 'donut' && <Donut points={points} />}
            {kind === 'donut' && (
              <div className="wsx-chart-legend">
                {points.map((point, index) => (
                  <span key={point.label + index}>
                    <i style={{ background: RAMP[index % RAMP.length] }} />
                    {point.label} · {point.value}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      }}
    </Bound>
  )
}
