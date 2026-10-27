import type { ChartBarsProps, ChartPoint } from '../lib/types'

/** Short labels — months, days, small numbers — stand under columns; anything longer reads sideways. */
const COLUMN_LABEL_MAX = 6
const COLUMN_COUNT_MAX = 12

function compact(value: number, locale?: string): string {
  return value.toLocaleString(locale, { notation: 'compact', maximumFractionDigits: 1 })
}

function exact(value: number, locale?: string): string {
  return value.toLocaleString(locale, { maximumFractionDigits: 2 })
}

function isColumnar(points: ChartPoint[]): boolean {
  return (
    points.length <= COLUMN_COUNT_MAX &&
    points.every((point) => point.label.length <= COLUMN_LABEL_MAX)
  )
}

/**
 * Bars in HTML, not a stretched picture: text stays its own size at any width, a long label gets
 * its own line, and every figure fits. Values read compact ("4.1M"); the exact one is on hover.
 */
export function ChartBars({ points, colors, locale }: ChartBarsProps) {
  const max = Math.max(1, ...points.map((point) => point.value))
  const share = (value: number) => `${Math.max(0, (value / max) * 100)}%`
  const color = (index: number) => colors[index % colors.length]

  if (isColumnar(points)) {
    return (
      <div className="wsx-columns" role="img" aria-label="Bar chart">
        {points.map((point, index) => (
          <div key={point.label + index} className="wsx-column" title={exact(point.value, locale)}>
            <span className="wsx-column-figure">{compact(point.value, locale)}</span>
            <span className="wsx-column-track">
              <i style={{ height: share(point.value), background: color(index) }} />
            </span>
            <span className="wsx-column-label">{point.label}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="wsx-bars" role="img" aria-label="Bar chart">
      {points.map((point, index) => (
        <div
          key={point.label + index}
          className="wsx-bar"
          title={`${point.label} · ${exact(point.value, locale)}`}
        >
          <span className="wsx-bar-label">{point.label}</span>
          <span className="wsx-bar-track">
            <i style={{ width: share(point.value), background: color(index) }} />
          </span>
          <span className="wsx-bar-figure">{compact(point.value, locale)}</span>
        </div>
      ))}
    </div>
  )
}
