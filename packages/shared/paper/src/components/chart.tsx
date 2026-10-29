import { columnOf, DAY, dayLabel, styled, useBind, useHistory } from '../lib'
import type {
  BoundChartProps,
  ChartBodyProps,
  ChartDonutProps,
  ChartLinesProps,
  ChartPoint,
  ChartProps,
  HistoryChartProps,
  Row,
} from '../lib/types'
import { usePaperHost } from '../provider'
import { ChartBars } from './chart-bars'
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
const TICK = { fontSize: 9, fill: 'var(--muted)', fontFamily: 'var(--font-sans)' }
const FIGURE = { fontSize: 9, fontWeight: 600, fill: 'var(--ink)', fontFamily: 'var(--font-sans)' }

function pickColumns(rows: Row[], label?: string, value?: string): [string, string] {
  return [label ?? columnOf(rows, 'string') ?? 'id', value ?? columnOf(rows, 'number') ?? 'count']
}

function figure(value: number, locale?: string): string {
  return value.toLocaleString(locale, { maximumFractionDigits: 1 })
}

function toPoints(rows: Row[], label?: string, value?: string, locale?: string): ChartPoint[] {
  const [labelKey, valueKey] = pickColumns(rows, label, value)
  // Days are a time axis: oldest first, whatever order the rows came in.
  const isDays = rows.length > 0 && rows.every((row) => DAY.test(String(row[labelKey] ?? '')))
  const ordered = isDays
    ? [...rows].sort((a, b) => String(a[labelKey]).localeCompare(String(b[labelKey])))
    : rows
  return ordered.map((row) => ({
    label: row[labelKey] === null ? 'None' : dayLabel(String(row[labelKey] ?? ''), locale),
    value: typeof row[valueKey] === 'number' ? (row[valueKey] as number) : 0,
  }))
}

/** First, middle and last label under the line; the latest and the peak value over it. */
function Lines({ points, area, locale }: ChartLinesProps) {
  const max = Math.max(1, ...points.map((point) => point.value))
  const step = points.length > 1 ? (W - PAD * 2) / (points.length - 1) : 0
  const coords = points.map(
    // 12px of headroom: the peak's value label sits above its point, inside the box.
    (point, index) => [PAD + step * index, H - 20 - ((H - 40) * point.value) / max] as const,
  )
  const last = points.length - 1
  const ticks = [...new Set([0, Math.floor(last / 2), last])].filter((index) => index >= 0)
  const peak = points.reduce(
    (best, point, index) => (point.value > (points[best]?.value ?? 0) ? index : best),
    0,
  )
  const isPeakAbove = (points[peak]?.value ?? 0) > (points[last]?.value ?? 0)
  const marked = (isPeakAbove ? [peak, last] : [last]).filter((index) => index >= 0)
  const anchor = (index: number) => (index === 0 ? 'start' : index === last ? 'end' : 'middle')
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
        <circle key={index} cx={x} cy={y} r="3" fill="var(--chart-1)">
          <title>{`${points[index]?.label} · ${figure(points[index]?.value ?? 0, locale)}`}</title>
        </circle>
      ))}
      {marked.map((index) => (
        <text
          key={`v${index}`}
          x={coords[index]?.[0]}
          y={(coords[index]?.[1] ?? 0) - 7}
          textAnchor={anchor(index)}
          {...FIGURE}
        >
          {figure(points[index]?.value ?? 0, locale)}
        </text>
      ))}
      {ticks.map((index) => (
        <text
          key={`t${index}`}
          x={coords[index]?.[0]}
          y={H - 6}
          textAnchor={anchor(index)}
          {...TICK}
        >
          {points[index]?.label}
        </text>
      ))}
    </svg>
  )
}

function Donut({ points }: ChartDonutProps) {
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
export function Chart({ bind, history, ...look }: ChartProps) {
  return history ? (
    <HistoryChart history={history} {...look} />
  ) : (
    <BoundChart bind={bind} {...look} />
  )
}

function BoundChart({ bind, label, ...look }: BoundChartProps) {
  return <ChartBody state={useBind(bind)} label={label ?? bind?.groupBy?.column} {...look} />
}

/** Over time: one point per day, labelled the way a person reads a date. */
function HistoryChart({ history, ...look }: HistoryChartProps) {
  return <ChartBody state={useHistory(history)} label="day" value="count" {...look} />
}

function ChartBody({ state, kind, label, value, empty, ...rest }: ChartBodyProps) {
  const { locale } = usePaperHost()
  return (
    <Bound state={state} empty={empty}>
      {(rows) => {
        const points = toPoints(rows, label, value, locale)
        return (
          <div {...styled(rest, 'wsx-chart')} data-kind={kind}>
            {kind === 'bar' && <ChartBars points={points} locale={locale} />}
            {(kind === 'line' || kind === 'area') && (
              <Lines points={points} area={kind === 'area'} locale={locale} />
            )}
            {kind === 'donut' && <Donut points={points} />}
            {kind === 'donut' && (
              <div className="wsx-chart-legend">
                {points.map((point, index) => (
                  <span key={point.label + index}>
                    <i style={{ background: RAMP[index % RAMP.length] }} />
                    {point.label} · {figure(point.value, locale)}
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
