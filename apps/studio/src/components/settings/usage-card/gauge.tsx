import type { GaugeProps } from '../lib'

/** A number against its line: dollars against the stop, turns against the cap. */
export function Gauge({ value, max, big, of, left, right, tone }: GaugeProps) {
  const ratio = max > 0 ? Math.min(1, value / max) : 0
  const over = value >= max
  const fill = over ? 'bg-[#b23b22]' : tone === 'spend' ? 'bg-primary' : 'bg-agent'

  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono font-semibold text-[26px] leading-none tracking-[-0.02em]">
          {big}
        </span>
        <span className="text-[13px] text-muted-foreground">{of}</span>
      </div>
      <div className="my-2.5 h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${ratio * 100}%` }} />
      </div>
      <div className="flex justify-between text-[12px] text-muted-foreground">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  )
}
